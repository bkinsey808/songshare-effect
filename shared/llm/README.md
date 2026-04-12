
Lightweight vendor-agnostic LLM wrapper for routing calls, counting tokens,
and simple file-based response caching. It's a minimal scaffold you can
adapt to your subscription tooling or extend with more provider features.

Key files
- `types.ts`: shared types and the `LLMClient` contract.
- `cache.ts`: filesystem cache stored under `.cache/llm/`.
- `openaiAdapter.ts`: OpenAI adapter implementation.
- `anthropicAdapter.ts`: Anthropic adapter implementation.
- `createClient.ts`: factory to choose a provider client.

What it helps you do
- **Centralize** LLM calls so truncation, model selection, and logging
	happen in one place.
- **Reduce token spend** via a file cache for identical requests.
- **Test safely** by swapping adapters (e.g. provide a mock or subscription
	adapter for CI/dev).

Quick usage

import { createClient } from './createClient'
import type { Message } from './types'

const client = createClient('openai')
const msgs: Message[] = [{ role: 'user', content: 'Summarize these notes' }]
const out = await client.chat(msgs, { maxTokens: 300 })
console.log(out.text, 'tokensUsed=', out.tokensUsed)

Subscription-only workflows (no API keys)
- This repo often uses managed subscription tooling. To support that, add
	an adapter that implements the `LLMClient` contract (e.g. `SubscriptionAdapter`).
	The adapter should:
	- accept the subscription endpoint / auth in its constructor,
	- check the file cache (`getCached`/`setCached`) using a request-derived
		key, and
	- POST the messages/opts to your subscription service, parse the response,
		cache the text, and return `{ text, tokensUsed }`.

Example adapter skeleton
```ts
// implement this in shared/llm/subscriptionAdapter.ts
import type { LLMClient, Message, ChatResult } from './types'
import countTokens from './tokenUtils'

export default class SubscriptionAdapter implements LLMClient {
	constructor(private endpoint: string, private headers?: Record<string,string>) {}
	async chat(messages: Message[], opts?: { model?: string; maxTokens?: number }) : Promise<ChatResult> {
		// check cache, post to endpoint, parse text, set cache
		return { text: 'response', tokensUsed: countTokens(messages) }
	}
}
```

Testing locally
- There is a small smoke test at `shared/llm/smoke.test.ts` that exercises
	the token counter and cache. Run:
```bash
npx vitest run shared/llm/smoke.test.ts
```

Notes & next steps
- `tokenUtils` is a simple approximator — replace with provider encoders
	(tiktoken or equivalent) for accurate accounting.
- Add a `mockAdapter` for CI to avoid network calls, and a `subscriptionAdapter`
	for production subscription flows.
- Consider adding metrics (cache hit rate, tokens per request) and rate limiting.

If you want, I can add a `subscriptionAdapter` implementation and wire it
into `createClient`, or add a `mockAdapter` for CI. Tell me which one to add.

Files:
- `types.ts` — shared types and interface `LLMClient`.
- `cache.ts` — simple filesystem cache under `.cache/llm/`.
- `openaiAdapter.ts` — OpenAI-compatible adapter.
- `anthropicAdapter.ts` — Anthropic-compatible adapter.
- `index.ts` — factory for creating provider clients.

To use: import the factory and types directly. Example:

import { createClient } from 'shared/llm/createClient';
import type { Message } from 'shared/llm/types';

const client = createClient('openai');
await client.chat([{ role: 'user', content: 'Hello' }]);
