import Mailgun from 'mailgun.js';
import formData from 'form-data';

export const API_KEY = process.env.MAILGUN_API_KEY as string | undefined;
export const DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const SENDER_ADDRESS = `CharmVerse <noreply@${DOMAIN}>`;

const mailgun = new Mailgun(formData);
const client = API_KEY ? mailgun.client({ username: 'api', key: API_KEY }) : null;

export default client;
