import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
function test(mood: String){
  return `Act as a Film Festival Programmer and Cinema Historian with an encyclopedic knowledge of global cinema.
  Curate a list of exactly 14 feature films based on this specific mood/vibe/query: "${mood}".
  
  SELECTION ALGORITHM & CRITERIA:
  1.  Thematic Precision (Highest Priority): The film's atmosphere, pacing, color palette, and narrative texture must explicitly match the requested "${mood}". Prioritize "vibe accuracy" over general critical acclaim.
  2.  Anti-Bias & Diversity Quotas (Strict Enforce):
      * Maximum 40% US/Hollywood productions. (Prioritize European, Asian, Latin American, and African cinema).
      * Maximum 25% released after 2010 (Counter recency bias).
      * Include at least 2 films from before 1970.
  3.  The "Hidden Gem" Factor: At least 8 titles must be "Deep Cuts" (films with excellent reputation among cinephiles but low mainstream visibility/box office).
  4.  Quality Control: While prioritizing mood, ensure films are competent. Avoid "trash" cinema unless the mood explicitly asks for "so bad it's good."
  5. Tell the user why the film is chosen, and what typicall the reviews say about it, what will they feel and experience when watching it.

  OUTPUT FORMAT:
  Return ONLY a valid, minified JSON array of strings (titles only).
  Do not include the release year in the string.
  Do not wrap the output in markdown code blocks.
  Do not add any conversational text, warnings, or explanations. Just the array.

  Example Output:
  [{"title":"Movie Title","reason":"One punchy sentence explaining the vibe match."}]
`
}



export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Main Logic
  try {
    const { mood } = req.body;
    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    let movies;
    
    // --- ATTEMPT 1: PREMIUM MODEL (High Precision) ---
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3-flash-preview',
        generationConfig: { responseMimeType: "application/json" } 
      });

      const prompt = test(mood);

      const result = await model.generateContent(prompt);
      movies = JSON.parse(result.response.text());

    } catch (err1) {
      console.log("Primary model failed. Switching to Standard Fallback...", err1);
      
      // --- ATTEMPT 2: STANDARD FALLBACK (Reliable) ---
      try {
        const fallbackModel = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = test(mood);
        const result = await fallbackModel.generateContent(prompt);
        movies = JSON.parse(result.response.text());

      } catch (err2) {
        console.log("Standard fallback failed. Switching to Lite...", err2);

        // --- ATTEMPT 3: LITE FALLBACK (Emergency / Low Latency) ---
        // Uses the lightweight model you requested
        const liteModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash-lite',
            generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = test(mood);

        const result = await liteModel.generateContent(prompt);
        movies = JSON.parse(result.response.text());
      }
    }

    return res.status(200).json({ movies });
    
  } catch (error) {
    console.error("All AI models failed:", error);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}