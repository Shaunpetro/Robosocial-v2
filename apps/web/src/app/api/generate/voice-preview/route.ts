// apps/web/src/app/api/generate/voice-preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industry, formality, personality, technicalLevel } = body;

    if (!companyName) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const personalityStr = Array.isArray(personality) && personality.length > 0
      ? personality.join(", ")
      : "professional";

    const prompt = `Generate a short social media post (20-50 words) for ${companyName}${industry ? ` in the ${industry} industry` : ""}.
Tone: ${formality}
Personality traits: ${personalityStr}
Technical level: ${technicalLevel}
The post should demonstrate the brand voice described above. It should be authentic, engaging, and appropriate for LinkedIn or Facebook.
Return only the post text, no explanations, no hashtags.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 100,
    });

    const preview = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Voice preview generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate preview" },
      { status: 500 }
    );
  }
}