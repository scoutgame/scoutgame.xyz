import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';

type DiscordAlertField = {
  name: string;
  value: string;
  inline?: boolean;
};

type DiscordAlertOptions = {
  title: string;
  description: string;
  fields?: DiscordAlertField[];
  color?: number; // Discord embed color (decimal value)
  url?: string;
  content?: string;
};

/**
 * Sends an alert to Discord webhook
 */
export async function sendDiscordAlert(options: DiscordAlertOptions): Promise<void> {
  const webhookUrl = process.env.DISCORD_ALERTS_WEBHOOK;

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

    log.info('Discord alert sent successfully', { title: options.title });
  } catch (error) {
    log.error('Failed to send Discord alert', { error, title: options.title });
  }
}
