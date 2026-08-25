// apps/web/src/lib/intelligence/analyzer.ts

/**
 * COMPANY INTELLIGENCE ANALYZER
 * Main orchestrator for AI-powered company analysis
 */

import Groq from 'groq-sdk';
import type {
  DataSources,
  CompanyAnalysis,
  CombinedExtractionResult
} from './extractors';
import { extractAndCombineText, calculateDataQuality, truncateForAnalysis } from './utils/text-cleaner';
import { buildAnalysisPrompt, buildContentThemesPrompt } from './prompts/analysis-prompt';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model fallback wrapper
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3.6-27b';

async function callGroq(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: PRIMARY_MODEL,
      temperature,
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.warn(`Groq primary model failed, falling back to ${FALLBACK_MODEL}:`, error);
    const fallback = await groq.chat.completions.create({
      messages,
      model: FALLBACK_MODEL,
      temperature,
      max_tokens: maxTokens,
    });
    return fallback.choices[0]?.message?.content || '';
  }
}

/**
 * Robust JSON extraction and parsing with cleanup of common LLM artifacts.
 */
function safeJsonParse<T = any>(text: string): T | null {
  let cleaned = text.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Extract substring from first { or [ to last } or ]
  const startObject = cleaned.indexOf('{');
  const startArray = cleaned.indexOf('[');
  let start = -1;
  let end = -1;
  let isObject = false;

  if (startObject !== -1 && (startArray === -1 || startObject < startArray)) {
    start = startObject;
    end = cleaned.lastIndexOf('}');
    isObject = true;
  } else if (startArray !== -1) {
    start = startArray;
    end = cleaned.lastIndexOf(']');
    isObject = false;
  }

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.warn('[safeJsonParse] Initial parse failed, attempting cleanup...');

    // Remove trailing commas
    let fixed = cleaned.replace(/,\s*([}\]])/g, '$1');

    // Remove comments if any (not typical, but safe)
    fixed = fixed.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    try {
      return JSON.parse(fixed) as T;
    } catch (secondError) {
      console.error('[safeJsonParse] Cleanup parse also failed:', secondError);
      return null;
    }
  }
}

// ============================================
// TYPES
// ============================================

export interface AnalysisResult {
  success: boolean;
  analysis: CompanyAnalysis | null;
  extraction: CombinedExtractionResult;
  error?: string;
  processingTime: number;
}

export interface AnalysisOptions {
  companyName: string;
  sources: DataSources;
  existingAnalysis?: CompanyAnalysis;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export async function analyzeCompany(options: AnalysisOptions): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    console.log(`[Analyzer] Starting analysis for: ${options.companyName}`);

    const extraction = await extractAndCombineText(options.sources);

    if (!extraction.success || !extraction.combinedText) {
      return {
        success: false,
        analysis: null,
        extraction,
        error: 'No content could be extracted from the provided sources',
        processingTime: Date.now() - startTime,
      };
    }

    console.log(`[Analyzer] Extracted text from ${extraction.sourcesProcessed.length} sources`);
    console.log(`[Analyzer] Combined text length: ${extraction.combinedText.length} characters`);

    const textForAnalysis = truncateForAnalysis(extraction.combinedText, 20000);
    const prompt = buildAnalysisPrompt(options.companyName, textForAnalysis);

    console.log(`[Analyzer] Sending to Groq for analysis...`);

    const responseText = await callGroq(
      [
        {
          role: 'system',
          content: 'You are a business intelligence analyst. You analyze company information and extract structured data. Always respond with valid JSON only, no markdown or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      0.3,
      4000
    );

    // Robust parse using safeJsonParse
    const analysis = safeJsonParse<CompanyAnalysis>(responseText);

    if (!analysis) {
      console.error('[Analyzer] Failed to parse Groq response. Raw:', responseText.substring(0, 1000));
      return {
        success: false,
        analysis: null,
        extraction,
        error: 'Failed to parse AI response as JSON',
        processingTime: Date.now() - startTime,
      };
    }

    // Validate required fields
    if (!analysis.industries || !Array.isArray(analysis.industries)) {
      throw new Error('Missing or invalid industries array');
    }
    if (!analysis.services || !Array.isArray(analysis.services)) {
      throw new Error('Missing or invalid services array');
    }

    analysis.dataQuality = calculateDataQuality(
      extraction.sourcesProcessed,
      extraction.combinedText.length
    );

    if (typeof analysis.confidenceScore !== 'number') {
      analysis.confidenceScore = calculateConfidenceScore(analysis, extraction);
    }

    console.log(`[Analyzer] Analysis complete. Found ${analysis.industries.length} industries, ${analysis.services.length} services`);

    return {
      success: true,
      analysis,
      extraction,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[Analyzer] Analysis failed:', error);

    return {
      success: false,
      analysis: null,
      extraction: {
        success: false,
        combinedText: '',
        sourcesProcessed: [],
        sourcesFailed: Object.keys(options.sources).filter(k => options.sources[k as keyof DataSources]),
        errors: [{ source: 'analyzer', error: error instanceof Error ? error.message : 'Unknown error' }],
        extractions: {},
      },
      error: error instanceof Error ? error.message : 'Analysis failed',
      processingTime: Date.now() - startTime,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateConfidenceScore(
  analysis: CompanyAnalysis,
  extraction: CombinedExtractionResult
): number {
  let score = 0.5;

  score += extraction.sourcesProcessed.length * 0.1;

  const avgIndustryConfidence = analysis.industries.length > 0
    ? analysis.industries.reduce((sum, i) => sum + i.confidence, 0) / analysis.industries.length
    : 0;
  score += avgIndustryConfidence * 0.15;

  if (analysis.services.length >= 5) score += 0.1;
  else if (analysis.services.length >= 3) score += 0.05;

  if (analysis.uniqueSellingPoints.length >= 3) score += 0.1;

  if (analysis.saContext.cidbGrades && Object.keys(analysis.saContext.cidbGrades).length > 0) {
    score += 0.1;
  }
  if (analysis.saContext.bbeeLevel) score += 0.05;

  return Math.min(0.95, Math.max(0.3, score));
}

export async function generateContentThemes(
  companyName: string,
  analysis: CompanyAnalysis,
  businessGoal: string
): Promise<CompanyAnalysis['suggestedContentThemes']> {
  try {
    const industries = analysis.industries.map(i => i.name).join(', ');
    const services = analysis.services.map(s => s.name).join(', ');
    const audience = analysis.targetAudience.description;

    const prompt = buildContentThemesPrompt(
      companyName,
      industries,
      services,
      audience,
      businessGoal
    );

    const responseText = await callGroq(
      [
        {
          role: 'system',
          content: 'You are a content strategist. Generate content themes that will help achieve business goals. Respond with valid JSON array only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      0.5,
      2000
    );

    const themes = safeJsonParse<Array<any>>(responseText);

    return Array.isArray(themes) ? themes : (analysis.suggestedContentThemes || []);
  } catch (error) {
    console.error('[Analyzer] Failed to generate content themes:', error);
    return analysis.suggestedContentThemes || [];
  }
}

export function validateAnalysis(analysis: CompanyAnalysis): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!analysis.industries || analysis.industries.length === 0) issues.push('No industries detected');
  if (!analysis.services || analysis.services.length === 0) issues.push('No services detected');
  if (!analysis.targetAudience || !analysis.targetAudience.businessType) issues.push('Target audience not identified');
  if (!analysis.brandVoice || !analysis.brandVoice.formality) issues.push('Brand voice not determined');
  if (analysis.confidenceScore < 0.5) issues.push('Low confidence in analysis - consider providing more data sources');

  return { valid: issues.length === 0, issues };
}

export function mergeAnalysisWithEdits(
  aiAnalysis: CompanyAnalysis,
  userEdits: Partial<CompanyAnalysis>
): CompanyAnalysis {
  return {
    ...aiAnalysis,
    ...userEdits,
    industries: userEdits.industries || aiAnalysis.industries,
    services: userEdits.services || aiAnalysis.services,
    uniqueSellingPoints: userEdits.uniqueSellingPoints || aiAnalysis.uniqueSellingPoints,
    suggestedContentThemes: userEdits.suggestedContentThemes || aiAnalysis.suggestedContentThemes,
    targetAudience: userEdits.targetAudience
      ? { ...aiAnalysis.targetAudience, ...userEdits.targetAudience }
      : aiAnalysis.targetAudience,
    brandVoice: userEdits.brandVoice
      ? { ...aiAnalysis.brandVoice, ...userEdits.brandVoice }
      : aiAnalysis.brandVoice,
    saContext: userEdits.saContext
      ? { ...aiAnalysis.saContext, ...userEdits.saContext }
      : aiAnalysis.saContext,
  };
}