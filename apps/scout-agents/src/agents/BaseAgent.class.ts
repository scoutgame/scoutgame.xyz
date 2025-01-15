import { llmLogger } from '@packages/llm/logger';
import { requestChatCompletion } from '@packages/llm/requestChatCompletion';
import type { ChatMessage, ToolDefinition } from '@packages/llm/types';

export type ToolDefinitionWithFunction = ToolDefinition & { function: (args: any) => Promise<any> };

type AgentConstructorParams = {
  systemPrompt: string;
  tools?: ToolDefinitionWithFunction[];
  openAiApiKey: string;
};

type ToolCallOutput = {
  tool: string;
  input: any;
  output: any;
};

type AgentResponse = {
  message: string;
  toolCalls?: ToolCallOutput[];
};

export class BaseAgent {
  private systemPrompt: string;

  private tools?: ToolDefinitionWithFunction[];

  private openAiApiKey: string;

  constructor({ systemPrompt, tools, openAiApiKey }: AgentConstructorParams) {
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.openAiApiKey = openAiApiKey;
  }

  async handleMessage({ message, history }: { message: string; history: ChatMessage[] }): Promise<AgentResponse> {
    let response = await requestChatCompletion({
      prompt: message,
      systemPrompt: this.systemPrompt,
      tools: this.tools,
      openAiApiKey: this.openAiApiKey
    });

    let toolCallsData: { tool: string; input: any; output: any }[] = [];

    if (response.tool_calls) {
      toolCallsData = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
          const tool = this.tools?.find((t) => t.name === toolCall.name);
          if (!tool) {
            llmLogger.warn(`Tool ${toolCall.name} not found`);
            return null;
          }

          try {
            const result = await tool.function(toolCall.arguments);
            return {
              tool: toolCall.name,
              input: toolCall.arguments,
              output: result
            };
          } catch (error) {
            llmLogger.warn(`Tool ${toolCall.name} failed:`, error);
            return null;
          }
        })
      ).then((results) => results.filter(Boolean) as { tool: string; input: any; output: any }[]);
    }

    if (toolCallsData.length > 0) {
      const toolCallsMessage = `I called some tools in response to your message. Here are the results that I'll use to give you a final answer:\n\n${toolCallsData
        .map((data) => `${data.tool}:\nInput: ${JSON.stringify(data.input)}\nOutput: ${JSON.stringify(data.output)}`)
        .join('\n\n')}`;

      response = await requestChatCompletion({
        prompt: `${message}\n\n${toolCallsMessage}`,
        systemPrompt: this.systemPrompt,
        history,
        openAiApiKey: this.openAiApiKey
      });
    }

    return {
      message: response.message ?? '',
      toolCalls: toolCallsData
    };
  }
}
