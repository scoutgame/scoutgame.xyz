import type { DiscordMessageOptions } from './client';
import { sendToWebhook } from './client';

/**
 * Sends an alert to Discord webhook
 */
export async function sendDiscordAlert(options: DiscordMessageOptions): Promise<void> {
  return sendToWebhook(process.env.DISCORD_ALERTS_WEBHOOK, options);
}
