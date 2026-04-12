export type Role = 'system' | 'user' | 'assistant';

export type Message = {
  role: Role;
  content: string;
};

export type ChatResult = {
  text: string;
  tokensUsed: number;
};

export type LLMClient = {
  chat(messages: Message[], opts?: { model?: string; maxTokens?: number; temperature?: number }): Promise<ChatResult>;
};
