import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a Senior AI Safety Engineer specializing in TikTok Shop Policy Compliance.
Your goal is to perform a strict multimodal analysis of a video, its caption, and its script to determine if it is safe to post.

TIKTOK SHOP POLICY GUIDELINES:
1. Misleading Claims: No exaggerated product effects or unrealistic promises.
2. Functional Claims: No medical, health, or beauty functional claims (e.g., "cures acne", "regrows hair") unless they are purely experiential.
3. Transformation Narratives: Strictly forbid "Before/After" visuals or narratives, whether explicit or implicit.
4. Time-based Results: No claims like "results in 3 days" or "instant change".
5. Measurable Promises: No "lose 10lbs" or "earn $1000".
6. Absolute Language: Flag words like "best", "real results", "changed everything", "guaranteed".
7. Testimonial Risk: Testimonials must be experiential ("I liked it") not factual ("It worked for me").
8. Regulated Categories: Supplements, cosmetics, and medical devices are high-risk.
9. CTA Risk: No aggressive or misleading Calls to Action.

SCORING MODEL (0-100 Risk):
- Transformation narrative: +50 risk
- Time-based claims: +40 risk
- Functional claims: +30 risk
- Absolute language: +15 risk
- Testimonial certainty: +20 risk

DECISION LOGIC:
- Risk Score >= 60: DO NOT POST
- Risk Score 20-59: POST WITH CHANGES
- Risk Score < 20: SAFE TO POST

You must return a JSON object matching the following schema.`;

export const COMPLIANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    finalDecision: {
      type: Type.STRING,
      description: "One of: 'SAFE TO POST', 'POST WITH CHANGES', 'DO NOT POST'",
    },
    overallRiskScore: {
      type: Type.NUMBER,
      description: "0-100 risk score",
    },
    captionRiskScore: {
      type: Type.NUMBER,
    },
    videoRiskScore: {
      type: Type.NUMBER,
    },
    flaggedSegments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "e.g. 0:05" },
          issue: { type: Type.STRING },
          policyReasoning: { type: Type.STRING },
        },
      },
    },
    flaggedPhrases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    exactFixes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    saferCaption: {
      type: Type.STRING,
    },
    saferScript: {
      type: Type.STRING,
    },
    justification: {
      type: Type.STRING,
      description: "Brief explanation of the decision",
    },
  },
  required: [
    "finalDecision",
    "overallRiskScore",
    "captionRiskScore",
    "videoRiskScore",
    "flaggedSegments",
    "flaggedPhrases",
    "exactFixes",
    "saferCaption",
    "saferScript",
    "justification",
  ],
};

export async function analyzeCompliance(
  videoBase64?: string,
  caption?: string,
  script?: string
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-3.1-pro-preview";

  const parts: any[] = [];
  
  if (videoBase64) {
    parts.push({
      inlineData: {
        mimeType: "video/mp4",
        data: videoBase64,
      },
    });
  }

  let prompt = "Analyze this TikTok content for Shop policy compliance.\n";
  if (caption) prompt += `Caption: ${caption}\n`;
  if (script) prompt += `Script: ${script}\n`;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: COMPLIANCE_SCHEMA,
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function testCaptionOnly(caption: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Test this TikTok Shop caption for compliance: "${caption}"` }] }],
    config: {
      systemInstruction: "You are a TikTok Shop compliance bot. Analyze the caption and return JSON with riskScore, flaggedPhrases, saferRewrite, and status (SAFE, CHANGES, RISKY).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.NUMBER },
          flaggedPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
          saferRewrite: { type: Type.STRING },
          status: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["riskScore", "flaggedPhrases", "saferRewrite", "status", "reasoning"]
      }
    },
  });

  return JSON.parse(response.text || "{}");
}
