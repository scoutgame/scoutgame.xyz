import type { DiscordMessageOptions } from './client';
import { sendToWebhook } from './client';

/**
 * Sends an alert to Discord webhook
 */
export async function sendDiscordEvent(options: DiscordMessageOptions): Promise<void> {
  return sendToWebhook(process.env.DISCORD_EVENTS_WEBHOOK, options);
}
