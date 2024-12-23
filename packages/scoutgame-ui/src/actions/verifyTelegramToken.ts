'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as yup from 'yup';

import { apiHash, apiId } from './telegramClient';

export const verifyTelegramTokenAction = authActionClient
  .metadata({ actionName: 'verify_telegram_token' })
  .schema(yup.object({ sessionId: yup.string().required() }))
  .action(async ({ parsedInput }) => {
    const session = new StringSession(parsedInput.sessionId);
    const client = new TelegramClient(session, apiId, apiHash, {});
    await client.connect();

    const result = await client.invoke(
      new Api.auth.ExportLoginToken({
        apiHash,
        apiId,
        exceptIds: []
      })
    );
    if (result instanceof Api.auth.LoginTokenSuccess && result.authorization instanceof Api.auth.Authorization) {
      return { success: true, result: result.authorization.user };
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
        return { success: true, result: migratedResult.authorization.user };
      }
    }

    return { success: false };
  });
