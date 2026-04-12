import type { LLMClient, Message, ChatResult } from './types'
import { getCached, setCached } from './cache'
import countTokens from './tokenUtils'
import isPlainObject from './utils'

export default class SubscriptionAdapter implements LLMClient {
  constructor(private endpoint: string, private headers?: Record<string, string>) {
    if (!endpoint) {
      throw new TypeError('SubscriptionAdapter requires an endpoint')
    }
  }

  private static findText(data: unknown): string | undefined {
    if (typeof data === 'string') {
      return data
    }
    if (!isPlainObject(data)) {
      return undefined
    }
    const anyData = data
    if (typeof anyData['text'] === 'string') {
      return anyData['text']
    }
    if (typeof anyData['completion'] === 'string') {
      return anyData['completion']
    }
    const { choices } = anyData
    const MIN_CHOICES = 1
    const FIRST_INDEX = 0
    if (Array.isArray(choices) && choices.length >= MIN_CHOICES) {
      const arr = choices as unknown[]
      const first = arr[FIRST_INDEX]
      if (isPlainObject(first)) {
        if (typeof first['text'] === 'string') {
          return first['text']
        }
        const { message } = first
        if (isPlainObject(message)) {
          const { content } = message
          if (typeof content === 'string') {
            return content
          }
        }
      }
    }
    return undefined
  }

  public async chat(messages: Message[], opts?: { model?: string; maxTokens?: number; temperature?: number }) : Promise<ChatResult> {
    const keyObj = { provider: 'subscription', messages, opts }
    const cached = await getCached(keyObj)
    if (typeof cached === 'string') {
      return { text: cached, tokensUsed: countTokens(messages) }
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(this.headers) },
      body: JSON.stringify({ messages, opts }),
    })

    const data: unknown = await res.json()
    const text = SubscriptionAdapter.findText(data)
    if (typeof text !== 'string') {
      throw new TypeError('Subscription adapter returned no text')
    }

    await setCached(keyObj, text)
    return { text, tokensUsed: countTokens(messages) }
  }
}
