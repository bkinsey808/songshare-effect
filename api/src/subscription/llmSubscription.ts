import type { Context } from 'hono'

function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export default async function llmSubscriptionHandler(ctx: Context): Promise<Response> {
  const bodyUnknown = (await ctx.req.json()) as unknown

  let messagesArray: unknown[] = []
  if (isObject(bodyUnknown)) {
    const maybeMessages = bodyUnknown['messages']
    if (Array.isArray(maybeMessages)) {
      messagesArray = maybeMessages
    }
  }

  const messageParts: string[] = []
  for (const item of messagesArray) {
    if (isObject(item)) {
      const { content } = item
      if (typeof content === 'string') {
        messageParts.push(content)
      }
    }
  }

  const MIN_PARTS = 1
  const responseText = messageParts.length >= MIN_PARTS ? `Mock reply: ${messageParts.join(' ')}` : 'Mock reply: (no messages)'
  return ctx.json({ text: responseText })
}
