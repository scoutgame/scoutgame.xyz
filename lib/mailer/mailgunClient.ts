import formData from 'form-data';
import Mailgun from 'mailgun.js';

export const API_KEY = process.env.MAILGUN_KEY as string | undefined;
export const DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const REPLYABLE_SENDER_ADDRESS = `CharmVerse <replies@updates.${DOMAIN}>`;
export const NON_REPLYABLE_SENDER_ADDRESS = `CharmVerse <noreply@${DOMAIN}>`;

const mailgun = new Mailgun(formData);
const client = API_KEY && API_KEY !== 'test-key' ? mailgun.client({ username: 'api', key: API_KEY }) : null;

export default client;
