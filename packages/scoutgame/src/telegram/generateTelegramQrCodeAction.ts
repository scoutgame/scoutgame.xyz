'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { telegramClients } from '@packages/scoutgame-ui/actions/telegramClient';
import * as QRCode from 'qrcode';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from '../constants';

export const generateTelegramQrCodeAction = authActionClient
  .metadata({ actionName: 'generate_telegram_qr_code' })
  .action(async ({ ctx }) => {
    const apiId = TELEGRAM_API_ID;
    const apiHash = TELEGRAM_API_HASH;

    if (!apiId || !apiHash) {
      throw new Error('Telegram API ID or hash is not set');
    }

    const session = new StringSession('');
    const client = new TelegramClient(session, apiId, apiHash, {});
    await client.connect();

    const userId = ctx.session.scoutId;
    telegramClients[userId] = client;

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
      const sessionId = client.session.save() as unknown as string;
      return {
        success: true,
        qrCodeImage,
        expires: loginToken.expires,
        sessionId
      };
    }

    throw new Error('Failed to generate Telegram QR code');
  });
