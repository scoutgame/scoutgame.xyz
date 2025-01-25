// eslint-disable-next-line camelcase
import { encoding_for_model } from 'tiktoken';

/**
 * Useful for checking context length
 */
export function tokenize({ text }: { text: string }): number {
  const enc = encoding_for_model('gpt-4o');

  const tokens = enc.encode(text);

  enc.free();

  return tokens.length;
}
