/**
 * Featherless AI client (OpenAI-compatible Chat Completions API).
 * Base URL: https://api.featherless.ai/v1
 * Model: deepseek-ai/DeepSeek-V3.2
 */

const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const FEATHERLESS_MODEL = 'deepseek-ai/DeepSeek-V3.2';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

export class FeatherlessError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'FeatherlessError';
  }
}

export function getFeatherlessApiKey(): string | null {
  const key = process.env.FEATHERLESS_API_KEY?.trim();
  if (!key || key === 'your_key_here' || key === 'YOUR_FEATHERLESS_API_KEY') {
    return null;
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new FeatherlessError('Empty response from Featherless AI');
  }

  // Prefer fenced JSON blocks if the model wraps output in markdown
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export async function featherlessChatJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const apiKey = getFeatherlessApiKey();
  if (!apiKey) {
    throw new FeatherlessError(
      'FEATHERLESS_API_KEY is missing or invalid. Set it in your .env file.',
      undefined,
      false
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: FEATHERLESS_MODEL,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        const retryable = response.status === 429 || response.status >= 500;
        throw new FeatherlessError(
          `Featherless AI request failed (${response.status}): ${errorBody || response.statusText}`,
          response.status,
          retryable
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new FeatherlessError('Featherless AI returned an empty response', undefined, true);
      }

      const jsonText = extractJsonPayload(content);
      try {
        return JSON.parse(jsonText) as T;
      } catch {
        throw new FeatherlessError('Featherless AI returned invalid JSON', undefined, true);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const retryable =
        err instanceof FeatherlessError
          ? err.retryable
          : true; // network errors are retryable

      if (!retryable || attempt === MAX_RETRIES) {
        break;
      }

      console.warn(
        `Featherless AI attempt ${attempt}/${MAX_RETRIES} failed, retrying...`,
        lastError.message
      );
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new FeatherlessError('Featherless AI request failed');
}
