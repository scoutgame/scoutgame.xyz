export const SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN = process.env.SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN as string;

/**
 * Passed in the query string of the telegram webhook to verify the request is coming from telegram
 */
export const AGENT_TELEGRAM_SECRET = process.env.SCOUT_AGENT_TELEGRAM_SECRET as string;
