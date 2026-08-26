// apps/web/src/app/api/generate/voice-preview/route.ts
import { NextRequest, NextResponse } from "next/server";

function getTechAdjective(technicalLevel: string): string {
  switch (technicalLevel) {
    case "low":
      return "simple and clear";
    case "high":
      return "advanced, expert-level";
    default:
      return "balanced and practical";
  }
}

function getTraitPhrase(personality: string[]): string {
  if (!Array.isArray(personality) || personality.length === 0) return "";
  const trait = personality[0].toLowerCase();
  return `We're ${trait} about what we do.`;
}

function buildPreview(
  companyName: string,
  industry: string | null,
  formality: string,
  personality: string[],
  technicalLevel: string
): string {
  const name = companyName || "Your business";
  const industryText = industry ? ` in the ${industry} industry` : "";
  const tech = getTechAdjective(technicalLevel);
  const traitPhrase = getTraitPhrase(personality);
  const personalityStr = Array.isArray(personality) && personality.length > 0
    ? personality.join(", ")
    : "expertise";

  let preview = "";

  switch (formality) {
    case "casual":
      if (technicalLevel === "high") {
        preview = `Hey! ${name}${industryText} just dropped some advanced insights you won't want to miss. ${traitPhrase} Check it out!`;
      } else if (technicalLevel === "low") {
        preview = `Hey! ${name}${industryText} made something super simple and fun. ${traitPhrase} Take a look! 😊`;
      } else {
        preview = `Hey! ${name}${industryText} just wrapped up something cool we had to share. ${traitPhrase} Hope you love it!`;
      }
      break;

    case "friendly":
      if (technicalLevel === "high") {
        preview = `Hello from ${name}${industryText}! We're excited to share a detailed update that showcases our expertise. ${traitPhrase}`;
      } else if (technicalLevel === "low") {
        preview = `Hello! At ${name}${industryText}, we keep things simple and friendly. ${traitPhrase} Here's a little something we think you'll enjoy.`;
      } else {
        preview = `Hello! ${name}${industryText} has some news to brighten your day. ${traitPhrase} We'd love to hear what you think.`;
      }
      break;

    case "professional":
      preview = `${name}${industryText} is pleased to share a brief update. Our ${tech} approach ensures quality results, backed by ${personalityStr}. Learn more today.`;
      break;

    case "corporate":
      preview = `${name}${industryText} announces a significant milestone, reflecting our commitment to excellence and ${personalityStr}. We remain dedicated to delivering value.`;
      break;

    case "formal":
      preview = `To our valued stakeholders, ${name}${industryText} formally announces the successful completion of a key initiative, executed with ${tech} precision.`;
      break;

    default:
      preview = `${name}${industryText} delivers quality results using a ${tech} approach, strengthened by ${personalityStr}. ${traitPhrase} Contact us to find out more.`;
  }

  return preview.replace(/\s+/g, " ").trim();
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