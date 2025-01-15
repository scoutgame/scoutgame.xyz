export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage<T extends ChatMessageRole = ChatMessageRole> = {
  content: string;
  role: T;
};

export type ChatCompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      refusal: null;
    };
    logprobs: null;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
  service_tier: string;
  system_fingerprint: string;
  // Customised version for easier usability
  message?: string | null;
  tool_calls?: {
    name: string;
    arguments: unknown;
  }[];
};

/**
 * @responseJsonSchema - Expected response schema from the LLM. If not provided, responses will be in the form of a string
 * https://platform.openai.com/docs/guides/structured-outputs/introduction
 * https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 */
const availableTypes = ['string', 'boolean', 'number'] as const;

type SchemaKeyType = (typeof availableTypes)[number];

export type ChatResponseSchemaItem = { type: SchemaKeyType; description: string; enum?: string[] | readonly string[] };

export type ToolDefinition<K extends string = string> = {
  name: string;
  description: string;
  parameters: Record<K, ChatResponseSchemaItem>;
  required: K[];
};
