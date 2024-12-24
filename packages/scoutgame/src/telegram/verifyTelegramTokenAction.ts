'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from '@packages/scoutgame/constants';
import { telegramClients } from '@packages/scoutgame-ui/actions/telegramClient';
import type { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { UpdateConnectionState } from 'telegram/network';

import { encrypt } from '../utils/crypto';

const TIMEOUT_MS = 30000;

// eslint-disable-next-line
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    await Promise.race([updatePromise, sleep(TIMEOUT_MS)]);
    const telegramUser = (await loginTelegramUser({ client })) as Api.User;
    delete telegramClients[scoutId];
    const encryptedTelegramId = encrypt(telegramUser.id.toString(), TELEGRAM_API_HASH);

    return {
      success: true,
      telegramUser: {
        id: encryptedTelegramId
      }
    };
  });
