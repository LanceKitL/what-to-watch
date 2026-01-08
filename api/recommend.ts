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
    const { mood } = req.body;

    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    // Use the fast, free model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `Recommend top 20 movies for a user who feels: "${mood}". 
    Return ONLY a JSON array of strings (titles only). 
    Example: ["The Matrix", "Inception"]`;

    const result = await model.generateContent(prompt);
    const movies = JSON.parse(result.response.text());

    return res.status(200).json({ movies });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}