'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as yup from 'yup';

import { apiHash, apiId } from './telegramClient';

const TIMEOUT_MS = 30000; // 30 seconds

// eslint-disable-next-line
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loginTelegramUser({ client }: { client: TelegramClient }) {
  const result = await client.invoke(
    new Api.auth.ExportLoginToken({
      apiHash,
      apiId,
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
  .schema(yup.object({ sessionId: yup.string().required() }))
  .action(async ({ parsedInput }) => {
    const session = new StringSession(parsedInput.sessionId);
    const client = new TelegramClient(session, apiId, apiHash, {});
    await client.connect();

    const updatePromise = new Promise<void>((resolve) => {
      client.addEventHandler(
        (update: Api.TypeUpdate) => {
          console.log({ update });
          if (update instanceof Api.UpdateLoginToken) {
            resolve();
          }
        },
        { build: (update: object) => update, resolve: () => new Promise<void>(() => {}) }
      );
    });

    await Promise.race([updatePromise, sleep(10000)]);
    const telegramUser = await loginTelegramUser({ client });
    return { success: true, telegramUser };
  });
