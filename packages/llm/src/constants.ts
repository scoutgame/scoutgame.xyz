export const CHAT_GPT_BASE_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * @see https://platform.openai.com/docs/models
 */
export const LLMModelsList = {
  openaiGpt4: 'chatgpt-4o-latest',
  openaiGpt4oMini: 'gpt-4o-mini-2024-07-18'
} as const;

export type LLMModel = keyof typeof LLMModelsList;
