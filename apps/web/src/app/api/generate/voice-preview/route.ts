// apps/web/src/app/api/generate/voice-preview/route.ts
import { NextRequest, NextResponse } from "next/server";

function buildPreview(
  companyName: string,
  industry: string | null,
  formality: string,
  personality: string[],
  technicalLevel: string
): string {
  const name = companyName || "Your business";
  const industryText = industry ? ` in the ${industry} industry` : "";
  const traits = Array.isArray(personality) && personality.length > 0
    ? personality.join(", ")
    : "expertise";

  switch (formality) {
    case "casual":
      return `Hey! ${name}${industryText} just made things easier for you. We're excited to share what we've been working on 😊`;
    case "friendly":
      return `Hello! At ${name}${industryText}, we love making our customers happy. Here's something we think you'll enjoy.`;
    case "corporate":
      return `${name}${industryText} is pleased to announce a significant milestone. Our commitment to excellence remains unwavering.`;
    case "formal":
      return `To our valued stakeholders, ${name}${industryText} formally announces the successful delivery of a key project.`;
    default:
      return `${name}${industryText} delivers quality results backed by ${traits} and a ${technicalLevel} technical approach. Learn more today.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industry, formality, personality, technicalLevel } = body;

    if (!companyName) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const preview = buildPreview(
      companyName,
      industry || null,
      formality || "professional",
      Array.isArray(personality) ? personality : [],
      technicalLevel || "medium"
    );

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Voice preview generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate preview" },
      { status: 500 }
    );
  }
}