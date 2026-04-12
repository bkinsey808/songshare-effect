import { getCached, setCached } from './cache';
import countTokens from './tokenUtils';
import type { ChatResult, LLMClient, Message } from './types';
import isPlainObject from './utils';

const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.2;

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/complete';

export default class AnthropicAdapter implements LLMClient {
  apiKey: string;
  constructor(apiKey: string | undefined) {
    if (apiKey === undefined || apiKey === '') { throw new Error('ANTHROPIC_API_KEY not provided'); }
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], opts?: { model?: string; maxTokens?: number; temperature?: number }): Promise<ChatResult> {
    const cacheKey = { provider: 'anthropic', messages, opts };
    const cached = await getCached(cacheKey);
    if (cached !== undefined) { return { text: cached, tokensUsed: countTokens(messages) }; }

    // Convert messages to a single prompt for Anthropic's completion endpoint
    const prompt = messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');

    const body = {
      model: opts?.model ?? 'claude-2.1',
      prompt,
      max_tokens_to_sample: opts?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts?.temperature ?? DEFAULT_TEMPERATURE,
    };

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) { throw new Error(`Anthropic error: ${res.status} ${await res.text()}`); }
    const raw: unknown = await res.json();
    let text = '';
      if (isPlainObject(raw)) {
        const obj = raw;
        if (typeof obj['completion'] === 'string') { text = obj['completion']; }
        else if (typeof obj['response'] === 'string') { text = obj['response']; }
      }
    await setCached(cacheKey, text);
    return { text, tokensUsed: countTokens(messages) };
  }
}
