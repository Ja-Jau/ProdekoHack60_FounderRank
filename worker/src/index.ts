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
  const { data } = await supabase
    .from('investor_settings')
    .select('allowed_regions, allowed_stages')
    .eq('id', 1)
    .single();

  return {
    allowedRegions: data?.allowed_regions || ['nordic_baltic'],
    allowedStages: data?.allowed_stages || ['seed', 'series_a'],
  };
}

async function sendTelegramAlert(candidate: any, analysis: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const message = `🚨 *High-Priority Founder Alert!*\n\n` +
    `👤 *${candidate.namn}* (Score: *${analysis.score}/100*)\n` +
    `🎯 *Verdict:* ${analysis.verdict}\n` +
    `💡 *Reasoning:* ${analysis.reasoning}\n\n` +
    `🔗 [View LinkedIn](${candidate.linkedin_url})`;

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram alert:', err);
  }
}

async function callGeminiWithRetry(prompt: string, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Score out of 100" },
              verdict: { type: Type.STRING, description: "'Must Meet', 'Maybe', or 'Pass'" },
              reasoning: { type: Type.STRING, description: "One short sentence explaining the score" }
            },
            required: ["score", "verdict", "reasoning"]
          }
        }
      });
      return JSON.parse(response.text!);
    } catch (err: any) {
      const isTransient = err.status === 503 || err.status === 429 || err?.message?.includes('503') || err?.message?.includes('429');
      if (isTransient && attempt < maxRetries) {
        const delayMs = attempt * 5000; 
        console.warn(`Gemini busy. Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
}

async function processInboundRequests() {
  const { allowedRegions, allowedStages } = await getActiveFilters();

  const { data: candidates, error } = await supabase
    .from('profiles') 
    .select('*')
    .is('score', null)
    .limit(20);

  if (error || !candidates || candidates.length === 0) return;

  for (const candidate of candidates) {
    console.log(`\nEvaluating filters for: ${candidate.namn}`);
    const candidateRegion = resolveRegion(candidate.country || candidate.slush_country);
    const candidateStage = normalizeStage(candidate.stage || candidate.company_stage);
    const regionMatch = allowedRegions.includes(candidateRegion);
    const stageMatch = allowedStages.length === 0 || allowedStages.includes(candidateStage);

    if (!regionMatch || !stageMatch) {
      const reasons: string[] = [];
      if (!regionMatch) reasons.push(`Region mismatch (${candidateRegion} not in [${allowedRegions.join(', ')}])`);
      if (!stageMatch) reasons.push(`Stage mismatch (${candidateStage} not in [${allowedStages.join(', ')}])`);

      console.log(`Dropping ${candidate.namn} before Apify scrape: ${reasons.join(', ')}`);

      // Update Supabase to avoid infinite polling loops
      await supabase
        .from('profiles')
        .update({
          score: 0,
          verdict: 'Pass',
          reasoning: `Auto-filtered: ${reasons.join(' & ')}`,
        })
        .eq('id', candidate.id);

      continue; // Skip Apify & Gemini entirely
    }

    // 3. Proceed with Apify LinkedIn Scraper
    try {
      console.log(`Qualified. Scraping LinkedIn: ${candidate.linkedin_url}`);
      const run = await apify.actor('LpVuK3Zozwuipa5bp').call({
        urls: [candidate.linkedin_url]
      });
      
      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      const linkedInProfile = items[0];

      if (!linkedInProfile) {
        throw new Error('No LinkedIn data returned from Apify.');
      }

      const compactProfile = {
        headline: linkedInProfile.headline || linkedInProfile.title || '',
        summary: linkedInProfile.summary || linkedInProfile.about || '',
        experience: Array.isArray(linkedInProfile.experience)
          ? linkedInProfile.experience.slice(0, 5).map((exp: any) => ({
              role: exp.title || exp.role,
              company: exp.companyName || exp.company,
              description: (exp.description || '').slice(0, 200)
            }))
          : linkedInProfile.positions || [],
        education: Array.isArray(linkedInProfile.education)
          ? linkedInProfile.education.slice(0, 3).map((edu: any) => ({
              school: edu.schoolName || edu.school,
              degree: edu.degreeName || edu.degree
            }))
          : [],
        skills: Array.isArray(linkedInProfile.skills)
          ? linkedInProfile.skills.slice(0, 10).map((s: any) => typeof s === 'string' ? s : s.name)
          : [],
        posts: Array.isArray(linkedInProfile.activity) 
          ? linkedInProfile.activity.slice(0, 3).map((post: any) => post.text || post.title).filter(Boolean)
          : []
      };

      const prompt = `
        You are a VC Associate at Slush. Evaluate this founder based on their application and LinkedIn profile.
        Application Bio/Message: "${candidate.slush_bio}"
        LinkedIn Summary: ${JSON.stringify(compactProfile)}
        
        Score them 0-100 based on founder pedigree (past startups, top tech companies) and relevance to a tech VC.
      `;

      const analysis = await callGeminiWithRetry(prompt);

      await supabase
        .from('profiles')
        .update({
          score: analysis.score,
          verdict: analysis.verdict,
          reasoning: analysis.reasoning,
        })
        .eq('id', candidate.id);

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
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

startWorker();