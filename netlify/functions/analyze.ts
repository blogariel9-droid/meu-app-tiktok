import { GoogleGenAI } from "@google/genai";

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = body.prompt;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ result: result.text }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
