import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { resolveRegion, normalizeStage } from './thesisGate';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getActiveFilters() {
  const { data } = await supabase.from('investor_settings').select('*').eq('id', 1).single();
  return {
    allowedRegions: data?.allowed_regions || ['nordic_baltic'],
    allowedStages: data?.allowed_stages || ['seed', 'series_a'],
    coreSectors: data?.core_sectors || 'No specific focus',
    excludedSectors: data?.excluded_sectors || 'None',
    founderArchetypes: data?.founder_archetypes || [],
    benchmarkCompanies: data?.benchmark_companies || 'None',
  };
}

async function sendTelegramAlert(candidate: any, analysis: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const message = `🚨 *High-Priority Founder Alert!*\n\n👤 *${candidate.namn}* (Score: *${analysis.score}/100*)\n🎯 *Verdict:* ${analysis.verdict}\n💡 *Reasoning:* ${analysis.reasoning}\n\n🔗 [View LinkedIn](${candidate.linkedin_url})`;
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
    });
  } catch (err) { console.error('Failed to send Telegram alert:', err); }
}

async function callGeminiWithRetry(prompt: string, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Sending data to Gemini... (Attempt ${attempt}/${maxRetries})`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash', contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Score out of 100" },
              verdict: { type: Type.STRING, description: "'Must Meet', 'Maybe', or 'Pass'" },
              reasoning: { type: Type.STRING, description: "One short sentence explaining the score and linkedin analysis" }
            }, required: ["score", "verdict", "reasoning"]
          }
        }
      });
      console.log(`Gemini evaluation complete.`);
      return JSON.parse(response.text!);
    } catch (err: any) {
      if ((err.status === 503 || err.status === 429) && attempt < maxRetries) {
        const delay = attempt * 5000;
        console.warn(`Gemini API busy (Rate Limit). Sleeping for ${delay / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

async function processInboundRequests() {
  const filters = await getActiveFilters();

  const { data: candidates, error } = await supabase
    .from('profiles') 
    .select('*')
    .is('score', null)
    .eq('status', 'pending')
    .limit(20);

  if (error || !candidates || candidates.length === 0) return;

  for (const candidate of candidates) {
    console.log(`\n-----------------------------------------`);
    console.log(`Evaluating filters for: ${candidate.namn}`);
    const candidateRegion = resolveRegion(candidate.country || candidate.slush_country);
    const candidateStage = normalizeStage(candidate.stage || candidate.companystate);
    const regionMatch = filters.allowedRegions.includes(candidateRegion) || filters.allowedRegions.includes('global');
    const stageMatch = filters.allowedStages.length === 0 || filters.allowedStages.includes(candidateStage);

    if (!regionMatch || !stageMatch) {
      const reasons: string[] = [];
      if (!regionMatch) reasons.push(`Region mismatch (${candidateRegion})`);
      if (!stageMatch) reasons.push(`Stage mismatch (${candidateStage})`);
      console.log(`Dropping ${candidate.namn} before Apify scrape: ${reasons.join(', ')}`);
      
      await supabase.from('profiles').update({ 
        score: 0, 
        verdict: 'Pass', 
        status: 'declined', 
        reasoning: `Auto-filtered: ${reasons.join(' & ')}` 
      }).eq('id', candidate.id);
      
      continue; 
    }

    try {
      console.log(`Qualified. Scraping LinkedIn: ${candidate.linkedin_url}`);
      const run = await apify.actor('LpVuK3Zozwuipa5bp').call({ urls: [candidate.linkedin_url] });
      console.log('Fetching scraped dataset from Apify...');
      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      const linkedInProfile = items[0];

      if (!linkedInProfile) throw new Error('No LinkedIn data returned from Apify.');

      const compactProfile = {
        headline: linkedInProfile.headline || '', summary: linkedInProfile.summary || '',
        experience: Array.isArray(linkedInProfile.experience) ? linkedInProfile.experience.slice(0, 5).map((e:any) => ({ role: e.title, company: e.companyName })) : [],
        education: Array.isArray(linkedInProfile.education) ? linkedInProfile.education.slice(0, 3).map((e:any) => ({ school: e.schoolName })) : []
      };

      const prompt = `
        You are a VC Associate at Slush. Evaluate this founder.
        
        **INVESTMENT MANDATE (Follow Strictly):**
        - Core Focus Verticals (Reward these): ${filters.coreSectors}
        - Excluded Sectors (Severely penalize these): ${filters.excludedSectors}
        - Preferred Founder Traits: ${filters.founderArchetypes.join(', ')}
        - Benchmark Companies to compare against: ${filters.benchmarkCompanies}
        
        **CANDIDATE DATA:**
        Application Bio: "${candidate.slush_bio}"
        LinkedIn Summary: ${JSON.stringify(compactProfile)}
        
        Score them 0-100 based on founder pedigree and mandate alignment. Provide a strict JSON response.
      `;

      const analysis = await callGeminiWithRetry(prompt);

      await supabase.from('profiles').update({
        score: analysis.score, verdict: analysis.verdict, reasoning: analysis.reasoning,
      }).eq('id', candidate.id);

      if (analysis.score >= 80 || analysis.verdict === 'Must Meet') {
        await sendTelegramAlert(candidate, analysis);
      }
      console.log(`Successfully scored ${candidate.namn} (${analysis.score}/100)`);
    } catch (err) { 
      console.error(`Failed to process ${candidate.namn}:`, err); 
    }
  }
}

async function startWorker() {
  console.log('Worker listening for unscored candidates...');
  while (true) {
    try { 
      await processInboundRequests(); 
    } catch (err) { 
      console.error('Worker loop error:', err); 
    }
    // Visually indicate that the loop is pausing, not frozen.
    console.log('Waiting 10 seconds before next DB poll...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}
startWorker();