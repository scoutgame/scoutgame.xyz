import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';

export type DiscordMessageField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordMessageOptions = {
  title: string;
  description: string;
  fields?: DiscordMessageField[];
  color?: number; // Discord embed color (decimal value)
  url?: string;
  content?: string;
};

/**
 * Sends an alert to Discord webhook
 */
export async function sendToWebhook(webhookUrl: string | undefined, options: DiscordMessageOptions): Promise<void> {
  if (!webhookUrl) {
    log.warn('Discord webhook URL not configured. Cannot send alert.');
    return;
  }

  try {
    const payload = {
      content: options.content,
      embeds: [
        {
          title: options.title,
          description: options.description,
          color: options.color || 0xff9900, // Default to orange if not specified
          fields: options.fields || [],
          timestamp: new Date().toISOString(),
          url: options.url
        }
      ]
    };

    await POST(webhookUrl, payload);

    log.info('Discord message sent successfully', { webhookUrl, title: options.title });
  } catch (error) {
    log.error('Failed to send Discord message', { error, webhookUrl, title: options.title });
  }
}
