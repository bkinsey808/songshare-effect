import AnthropicAdapter from './anthropicAdapter'
import OpenAIAdapter from './openaiAdapter'
import SubscriptionAdapter from './subscriptionAdapter'
import type { LLMClient } from './types'

export type Provider = 'openai' | 'anthropic' | 'subscription'

export function createClient(
  provider: Provider,
  opts?: { apiKey?: string; endpoint?: string; headers?: Record<string, string> },
): LLMClient {
  switch (provider) {
    case 'openai': {
      return new OpenAIAdapter(opts?.apiKey ?? process.env['OPENAI_API_KEY'])
    }
    case 'anthropic': {
      return new AnthropicAdapter(opts?.apiKey ?? process.env['ANTHROPIC_API_KEY'])
    }
    case 'subscription': {
      return new SubscriptionAdapter(opts?.endpoint ?? process.env['LLM_SUBSCRIPTION_ENDPOINT'] ?? '', opts?.headers)
    }
    default: {
      throw new Error(`Unsupported provider: ${String(provider)}`)
    }
  }
}
