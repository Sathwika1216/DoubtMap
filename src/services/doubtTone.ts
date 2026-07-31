/**
 * DoubtTone AI — analyzes learning intent behind a student doubt.
 * Reuses the existing Featherless client (no new AI provider).
 * Does not censor or delete student submissions.
 */

import { featherlessChatJson, getFeatherlessApiKey } from './featherless.js';
import type {
  DoubtIntent,
  DoubtTone,
  DoubtToneAnalysis,
  DoubtToneResult,
  DoubtToneUnavailable,
} from '../types.js';

const TONES: readonly DoubtTone[] = [
  'respectful',
  'neutral',
  'frustrated',
  'angry',
  'rude',
  'abusive',
] as const;

const INTENTS: readonly DoubtIntent[] = [
  'genuine_doubt',
  'conceptual_confusion',
  'request_for_example',
  'request_for_clarification',
  'feedback_complaint',
  'irrelevant',
  'other',
] as const;

const ANALYSIS_TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT = `You are DoubtTone AI, an educational assistant for classroom doubt analysis.

Your job is to understand the LEARNING INTENT behind a student's message, even when the wording is frustrated, rude, or emotional.

Critical rules:
- Focus on educational intent. Ignore emotional wording when extracting the conceptual issue.
- Do NOT judge, shame, or punish the student.
- Do NOT invent a conceptual doubt when none exists (e.g. off-topic chat).
- Rude + genuine confusion must be KEPT as a genuine doubt (is_genuine_doubt: true).
- Abusive content should be flagged with tone "abusive" but still analyzed; never recommend deletion.
- Provide a respectful rephrasing only when it helps clarify the learning question; for already-clear respectful doubts, rephrased_doubt can closely match the original.
- Return valid JSON only. No markdown, no commentary.

Tone must be one of: respectful, neutral, frustrated, angry, rude, abusive
Intent must be one of: genuine_doubt, conceptual_confusion, request_for_example, request_for_clarification, feedback_complaint, irrelevant, other

JSON shape:
{
  "tone": "...",
  "intent": "...",
  "is_genuine_doubt": true,
  "underlying_doubt": "short conceptual issue in plain language",
  "rephrased_doubt": "respectful student-facing rewrite of the question",
  "topic": "short topic label",
  "confidence": 0.0
}`;

export function unavailableAnalysis(): DoubtToneUnavailable {
  return { analysis_available: false };
}

function isTone(value: unknown): value is DoubtTone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}

function isIntent(value: unknown): value is DoubtIntent {
  return typeof value === 'string' && (INTENTS as readonly string[]).includes(value);
}

/**
 * Validate and normalize a raw AI JSON object into DoubtToneAnalysis.
 * Throws if required fields are missing or categories are unexpected.
 */
export function validateDoubtTonePayload(raw: unknown): DoubtToneAnalysis {
  if (!raw || typeof raw !== 'object') {
    throw new Error('DoubtTone response is not an object');
  }

  const data = raw as Record<string, unknown>;

  if (!isTone(data.tone)) {
    throw new Error(`Unexpected tone category: ${String(data.tone)}`);
  }
  if (!isIntent(data.intent)) {
    throw new Error(`Unexpected intent category: ${String(data.intent)}`);
  }

  const underlying = typeof data.underlying_doubt === 'string' ? data.underlying_doubt.trim() : '';
  const rephrased = typeof data.rephrased_doubt === 'string' ? data.rephrased_doubt.trim() : '';
  const topic = typeof data.topic === 'string' ? data.topic.trim() : '';

  if (data.intent !== 'irrelevant' && data.intent !== 'other' && !underlying) {
    throw new Error('Missing underlying_doubt for a learning-related intent');
  }

  let confidence = Number(data.confidence);
  if (!Number.isFinite(confidence)) {
    throw new Error('Missing or invalid confidence');
  }
  confidence = Math.min(1, Math.max(0, confidence));

  const isGenuine =
    typeof data.is_genuine_doubt === 'boolean'
      ? data.is_genuine_doubt
      : data.intent !== 'irrelevant' && data.intent !== 'feedback_complaint';

  return {
    analysis_available: true,
    tone: data.tone,
    intent: data.intent,
    is_genuine_doubt: isGenuine,
    underlying_doubt: underlying || topic || 'Unspecified learning question',
    rephrased_doubt: rephrased || underlying || topic,
    topic: topic || 'general',
    confidence,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`DoubtTone analysis timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Analyze a student doubt for tone + learning intent.
 * On any failure (no key, timeout, invalid JSON, API error), returns { analysis_available: false }.
 */
export async function analyzeDoubtTone(doubtText: string): Promise<DoubtToneResult> {
  const text = doubtText?.trim();
  if (!text) {
    return unavailableAnalysis();
  }

  if (!getFeatherlessApiKey()) {
    console.warn('DoubtTone: FEATHERLESS_API_KEY unavailable — returning safe fallback');
    return unavailableAnalysis();
  }

  try {
    const userPrompt = `Analyze this anonymous student message for learning intent.

Student message:
"""
${text.slice(0, 1000)}
"""

Return JSON only.`;

    const raw = await withTimeout(
      featherlessChatJson<unknown>(SYSTEM_PROMPT, userPrompt, {
        temperature: 0.2,
        maxTokens: 800,
      }),
      ANALYSIS_TIMEOUT_MS
    );

    return validateDoubtTonePayload(raw);
  } catch (err) {
    console.warn('DoubtTone analysis failed — returning safe fallback:', err);
    return unavailableAnalysis();
  }
}

/** True when the student may benefit from an optional rephrase card (Stage 3 UI). */
export function shouldOfferRephrase(analysis: DoubtToneAnalysis): boolean {
  if (!analysis.is_genuine_doubt) return false;
  return (
    analysis.tone === 'frustrated' ||
    analysis.tone === 'angry' ||
    analysis.tone === 'rude' ||
    analysis.tone === 'abusive'
  );
}
