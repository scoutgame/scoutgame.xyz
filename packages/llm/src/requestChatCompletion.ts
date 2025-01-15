import { InvalidInputError, SystemError } from '@charmverse/core/errors';
import { POST } from '@packages/utils/http';
import { prettyPrint } from '@packages/utils/strings';
import OpenAI from 'openai';

import type { LLMModel } from './constants';
import { CHAT_GPT_BASE_URL, LLMModelsList } from './constants';
import { llmLogger } from './logger';
import type { ChatCompletionResponse, ChatMessage, ToolDefinition } from './types';

/**
 * @model - Defaults to gpt-4o-mini
 */
type ChatCompletionRequest = {
  prompt: string;
  openAiApiKey: string;
  systemPrompt?: string;
  history?: ChatMessage[];
  model?: LLMModel;
  tools?: ToolDefinition[];
};

export async function requestChatCompletion({
  prompt,
  model = 'openaiGpt4oMini',
  openAiApiKey,
  systemPrompt,
  history,
  tools
}: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  if (!openAiApiKey) {
    throw new InvalidInputError('OpenAI API key is required');
  }

  const input: ChatMessage[] = [];

  if (systemPrompt) {
    input.push({ role: 'system', content: systemPrompt });
  }

  if (history) {
    input.push(...history);
  }

  input.push({ role: 'user', content: prompt });

  const client = new OpenAI({
    apiKey: openAiApiKey
  });

  const response = await client.chat.completions.create({
    messages: input,
    model: LLMModelsList[model],
    tools: tools?.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: tool.required
        }
      }
    }))
  });

  llmLogger.info('Agent requested a tool call', { toolCalls: response.choices[0].message.tool_calls });

  function parseToolCallArguments(argsString: string) {
    try {
      return JSON.parse(argsString);
    } catch (e) {
      llmLogger.warn('Failed to parse tool call arguments:', e);
      return argsString;
    }
  }

  return {
    ...response,
    message: response.choices[0].message.content,
    tool_calls: response.choices[0].message.tool_calls?.map((toolCall) => ({
      name: toolCall.function.name,
      arguments: parseToolCallArguments(toolCall.function.arguments)
    }))
  } as ChatCompletionResponse;
}
