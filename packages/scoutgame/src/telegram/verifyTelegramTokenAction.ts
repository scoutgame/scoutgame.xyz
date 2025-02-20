'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { telegramClients } from '@packages/scoutgame-ui/actions/telegramClient';
import { delay } from '@packages/utils/async';
import type { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { UpdateConnectionState } from 'telegram/network';

import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from '../constants';

import { encrypt } from './crypto';

const TIMEOUT_MS = 30000;

class SessionPasswordNeededError extends Error {
  constructor() {
    super('Session password needed');
  }
}

async function loginTelegramUser({ client }: { client: TelegramClient }) {
  const result = await client.invoke(
    new Api.auth.ExportLoginToken({
      apiHash: TELEGRAM_API_HASH,
      apiId: TELEGRAM_API_ID,
      exceptIds: []
    })
  );

  if (result instanceof Api.auth.LoginTokenSuccess && result.authorization instanceof Api.auth.Authorization) {
    return result.authorization.user;
  } else if (result instanceof Api.auth.LoginTokenMigrateTo) {
    try {
      await client._switchDC(result.dcId);
      const migratedResult = await client.invoke(
        new Api.auth.ImportLoginToken({
          token: result.token
        })
      );

      if (
        migratedResult instanceof Api.auth.LoginTokenSuccess &&
        migratedResult.authorization instanceof Api.auth.Authorization
      ) {
        return migratedResult.authorization.user;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        throw new SessionPasswordNeededError();
      }
      throw error;
    }
  }

  throw new Error('Failed to login Telegram user');
}

export const verifyTelegramTokenAction = authActionClient
  .metadata({ actionName: 'verify_telegram_token' })
  .action(async ({ ctx }) => {
    const scoutId = ctx.session.scoutId;
    const client = telegramClients[scoutId];

    if (!client) {
      throw new Error('Telegram client not found');
    }

    if (!TELEGRAM_API_HASH) {
      throw new Error('Telegram API hash is not set');
    }

    const updatePromise = new Promise<void>((resolve) => {
      client.addEventHandler((update: Api.TypeUpdate) => {
        if (update instanceof UpdateConnectionState) {
          resolve();
        }
      });
    });

    await Promise.race([updatePromise, delay(TIMEOUT_MS)]);
    const telegramUser = (await loginTelegramUser({ client })) as Api.User;
    const encryptedTelegramId = encrypt(telegramUser.id.toString(), TELEGRAM_API_HASH);
    client.session.delete();
    delete telegramClients[scoutId];
    await client.destroy();
    return {
      success: true,
      telegramUser: {
        id: encryptedTelegramId
      }
    };
  });
