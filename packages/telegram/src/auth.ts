export type BotToken = {
  token: string;
};

export const telegramApiBaseUrl = 'https://api.telegram.org';

export function getTelegramBaseUrl({ token, path }: BotToken & { path?: string }): string {
  return `${telegramApiBaseUrl}/bot${token}${path ?? ''}`;
}
