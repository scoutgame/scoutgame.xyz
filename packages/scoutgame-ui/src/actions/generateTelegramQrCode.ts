'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import * as QRCode from 'qrcode';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { v4 } from 'uuid';

import { apiHash, apiId } from './telegramClient';

export const generateTelegramQrCodeAction = authActionClient
  .metadata({ actionName: 'generate_telegram_qr_code' })
  .action(async () => {
    const sessionId = v4();
    const session = new StringSession(sessionId);
    const client = new TelegramClient(session, apiId, apiHash, {});

    await client.connect();

    const loginToken = await client.invoke(
      new Api.auth.ExportLoginToken({
        apiId,
        apiHash,
        exceptIds: []
      })
    );

    if (loginToken instanceof Api.auth.LoginToken) {
      const base64Token = Buffer.from(loginToken.token).toString('base64url');
      const qrUrl = `tg://login?token=${base64Token}`;
      const qrCodeImage = await QRCode.toDataURL(qrUrl);
      return {
        success: true,
        qrCodeImage,
        expires: loginToken.expires,
        sessionId
      };
    }

    throw new Error('Failed to generate Telegram QR code');
  });
