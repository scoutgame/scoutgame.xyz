import { llmLogger } from '@packages/llm/logger';
import { requestChatCompletion } from '@packages/llm/requestChatCompletion';
import type { ChatMessage, ToolCallOutput, ToolDefinitionWithFunction } from '@packages/llm/types';

export type AgentConstructorParams = {
  systemPrompt: string;
  tools?: ToolDefinitionWithFunction[];
  openAiApiKey: string;
};

export type AgentResponse = {
  message: string;
  toolCalls?: ToolCallOutput[];
};

const basePrompt = `

==========

Always focus on your goal.

If the user deviates from your goal, gently guide them back to it.

If the user mentions a topic completely unrelated to your goal, politely ask them to focus on the topic you're interested in.

When providing content with links, always do it in markdown format.
`;

export class BaseAgent {
  private systemPrompt: string;

  private tools?: ToolDefinitionWithFunction[];

  private openAiApiKey: string;

  constructor({ systemPrompt, tools, openAiApiKey }: AgentConstructorParams) {
    this.systemPrompt = `${basePrompt}\n\n${systemPrompt}`;
    this.tools = tools;
    this.openAiApiKey = openAiApiKey;
  }

  async handleMessage({ message, history }: { message: string; history: ChatMessage[] }): Promise<AgentResponse> {
    let response = await requestChatCompletion({
      prompt: message,
      history,
      systemPrompt: this.systemPrompt,
      tools: this.tools?.map(({ functionImplementation, ...tool }) => tool),
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
            const result = await tool.functionImplementation(toolCall.arguments);
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

    const noToolCallsOrMessage = toolCallsData.length === 0 && !response.message;

    return {
      message: response.message ? response.message : noToolCallsOrMessage ? "I had a glitch, let's try again." : '',
      toolCalls: toolCallsData
    };
  }
}
