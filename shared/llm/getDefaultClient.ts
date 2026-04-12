import { createClient } from './createClient'
import type { LLMClient } from './types'

export default function getDefaultClient(opts?: { apiKey?: string; endpoint?: string; headers?: Record<string, string> | undefined }): LLMClient {
  const endpoint = opts?.endpoint ?? process.env['LLM_SUBSCRIPTION_ENDPOINT']
  if (endpoint !== undefined && endpoint !== null && endpoint !== '') {
    if (opts?.headers) {
      return createClient('subscription', { endpoint, headers: opts.headers })
    }
    return createClient('subscription', { endpoint })
  }

  const openaiKey = opts?.apiKey ?? process.env['OPENAI_API_KEY']
  if (openaiKey !== undefined && openaiKey !== null && openaiKey !== '') {
    return createClient('openai', { apiKey: openaiKey })
  }

  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (anthropicKey !== undefined && anthropicKey !== null && anthropicKey !== '') {
    return createClient('anthropic', { apiKey: anthropicKey })
  }

  throw new Error('No LLM provider configured. Set LLM_SUBSCRIPTION_ENDPOINT or OPENAI_API_KEY or pass explicit opts')
}
