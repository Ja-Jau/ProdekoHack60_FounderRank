import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize the three connected services
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function processInboundRequests() {
  console.log('Fetching pending requests from Supabase...');
  
  // 1. Get rows that haven't been scored yet
  const { data: candidates, error } = await supabase
    .from('profiles') 
    .select('*')
    .is('score', null)
    .limit(3);

  if (error || !candidates || candidates.length === 0) {
    console.log('No pending candidates found.');
    return;
  }

  for (const candidate of candidates) {
    console.log(`\nProcessing ${candidate.namn}...`);

    try {
      // 2. Scrape LinkedIn profile using Apify
      console.log(`Scraping LinkedIn: ${candidate.linkedin_url}`);
      // Note: "microworlds/linkedin-profile-scraper" is a common Apify actor. 
      // Update the actor ID if you are using a different one.
      const run = await apify.actor('LpVuK3Zozwuipa5bp').call({
        urls: [candidate.linkedin_url]
      });
      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      const linkedInProfile = items[0];

      if (!linkedInProfile) {
        throw new Error('No LinkedIn data returned from Apify.');
      }

      // 3. Analyze with Gemini using Structured Outputs
      console.log('Sending data to Gemini for scoring...');
      const prompt = `
        You are a VC Associate at Slush. Evaluate this founder based on their application and LinkedIn profile.
        Application Bio/Message: "${candidate.slush_bio}"
        LinkedIn Data: ${JSON.stringify(linkedInProfile)}
        
        Score them 0-100 based on founder pedigree (past startups, top tech companies) and relevance to VC.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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

      const analysis = JSON.parse(response.text!);

      // 4. Update Supabase with the final score
      console.log(`Saving score: ${analysis.score}/100`);
      await supabase
        .from('profiles')
        .update({
          score: analysis.score,
          verdict: analysis.verdict,
          reasoning: analysis.reasoning,
        })
        .eq('id', candidate.id);

      console.log(`Successfully processed ${candidate.namn}.`);

    } catch (err) {
      console.error(`Failed to process ${candidate.namn}:`, err);
    }
  }
}

// Run the function
processInboundRequests();