import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// HELPER: Send Telegram alert for high-priority founders
async function sendTelegramAlert(candidate: any, analysis: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram token or chat ID not set in .env. Skipping notification.');
    return;
  }

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
    console.log(`Telegram alert sent for ${candidate.namn}!`);
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
        console.warn(`\nGemini API busy. Retrying in ${delayMs / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
}

async function processInboundRequests() {
  console.log('Fetching pending requests from Supabase...');
  
  const { data: candidates, error } = await supabase
    .from('profiles') 
    .select('*')
    .is('score', null)
    .limit(20);

  if (error || !candidates || candidates.length === 0) {
    console.log('No pending candidates found.');
    return;
  }

  for (const candidate of candidates) {
    console.log(`\nProcessing ${candidate.namn}...`);

    try {
      console.log(`Scraping LinkedIn: ${candidate.linkedin_url}`);
      const run = await apify.actor('LpVuK3Zozwuipa5bp').call({
        urls: [candidate.linkedin_url]
      });
      
      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      const linkedInProfile = items[0];

      if (!linkedInProfile) {
        throw new Error('No LinkedIn data returned from Apify.');
      }

      console.log('Sending data to Gemini for scoring...');
      
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

      console.log(`Saving score: ${analysis.score}/100`);
      await supabase
        .from('profiles')
        .update({
          score: analysis.score,
          verdict: analysis.verdict,
          reasoning: analysis.reasoning,
        })
        .eq('id', candidate.id);

      // --- SEND TELEGRAM ALERT FOR HIGH-SCORE PROFILES ---
      if (analysis.score >= 80 || analysis.verdict === 'Must Meet') {
        await sendTelegramAlert(candidate, analysis);
      }

      console.log(`Successfully processed ${candidate.namn}.`);

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
      console.error('Worker loop encountered an error:', err);
    }
    // Sleep for 10 seconds before checking Supabase again
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

startWorker();