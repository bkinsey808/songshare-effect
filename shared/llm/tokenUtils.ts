import type { Message } from './types';

export default function countTokens(messages: Message[]): number {
  const joined = messages.map((msg) => msg.content).join('\n');
  return joined.split(/\s+/).filter(Boolean).length;
}
