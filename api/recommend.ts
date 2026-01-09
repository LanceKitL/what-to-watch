import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Headers (Allows your frontend to talk to this backend)
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle the "preflight" check from the browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Main Logic
  try {
    const { mood, genres } = req.body;

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // Use the fast, free model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
    Act as a sophisticated film critic and curator. 
    Recommend a list of 20 movies for a user who describes their mood/vibe as: "${mood}".

    CRITERIA FOR SELECTION:
    1. Focus on "Review-Based" Quality: Prioritize films with high critical acclaim or strong audience scores (e.g., high Rotten Tomatoes/Letterboxd ratings).
    2. Include "Hidden Gems": Ensure at least 30-40% of the list consists of underrated, cult classic, or lesser-known masterpieces, not just mainstream blockbusters.
    3. Diversity: Include a mix of eras (classics to modern) and international films if they fit the vibe perfectly.
    4. Accuracy: The "emotional resonance" of the film must match the user's mood.

    OUTPUT FORMAT:
    Return ONLY a raw JSON array of strings (titles only). 
    Do not use Markdown formatting (no \`\`\`json).
    Example: ["Portrait of a Lady on Fire", "Whiplash", "The Grand Budapest Hotel"]
  `;

    const result = await model.generateContent(prompt);
    const movies = JSON.parse(result.response.text());

    return res.status(200).json({ movies });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}