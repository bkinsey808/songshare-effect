import { describe, it, expect } from 'vitest'
import countTokens from './tokenUtils'
import { getCached, setCached } from './cache'
import type { Message } from './types'

describe('shared/llm smoke', () => {
  it('countTokens and cache basic flow', async () => {
    const msgs: Message[] = [{ role: 'user', content: 'hello world' }]
    const t = countTokens(msgs)
    expect(typeof t).toBe('number')

    const cacheKey = { keyName: 'smoke', msgs }
    await setCached(cacheKey, 'the-response')
    const cachedValue = await getCached(cacheKey)
    expect(cachedValue).toBe('the-response')
  })
})
