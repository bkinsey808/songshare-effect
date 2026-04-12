import { getCached, setCached } from './cache';
import countTokens from './tokenUtils';
import type { ChatResult, LLMClient, Message } from './types';
import isPlainObject from './utils';

const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.2;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const FIRST_CHOICE_INDEX = 0;

function findOpenAIText(raw: unknown): string | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  // eslint-disable-next-line prefer-destructuring -- narrow via Array.isArray below
  const choices = raw['choices'];
  if (!Array.isArray(choices) || choices.length <= FIRST_CHOICE_INDEX) {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- guarded by Array.isArray check
  const first = choices[FIRST_CHOICE_INDEX];
  if (!isPlainObject(first)) {
    return undefined;
  }
  const { message: maybeMessage, text: alt } = first;
  if (isPlainObject(maybeMessage)) {
    const { content } = maybeMessage;
    if (typeof content === 'string') {
      return content;
    }
  }
  if (typeof alt === 'string') {
    return alt;
  }
  return undefined;
}

export default class OpenAIAdapter implements LLMClient {
  apiKey: string;
  constructor(apiKey: string | undefined) {
    if (apiKey === undefined || apiKey === '') {
      throw new Error('OPENAI_API_KEY not provided');
    }
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], opts?: { model?: string; maxTokens?: number; temperature?: number }): Promise<ChatResult> {
    const cacheKey = { provider: 'openai', messages, opts };
    const cached = await getCached(cacheKey);
    if (cached !== undefined) {
      return { text: cached, tokensUsed: countTokens(messages) };
    }

    const body = {
      model: opts?.model ?? 'gpt-4o-mini',
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      max_tokens: opts?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts?.temperature ?? DEFAULT_TEMPERATURE,
    };

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) { throw new Error(`OpenAI error: ${res.status} ${await res.text()}`); }
    const raw: unknown = await res.json();
    let text = '';
    const extracted = findOpenAIText(raw);
    if (extracted === undefined) {
      try {
        text = JSON.stringify(raw);
      } catch {
        text = String(raw);
      }
    } else {
      text = extracted;
    }
    await setCached(cacheKey, text);
    return { text, tokensUsed: countTokens(messages) };
  }
}
