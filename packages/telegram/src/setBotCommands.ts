import { POST } from '@packages/utils/http';

import { getTelegramBaseUrl } from './auth';
import type { BotToken } from './auth';

type MenuCommand = {
  command: string;
  description: string;
};

type MenuConfiguration = {
  commands: MenuCommand[];
};

export async function setBotCommands({
  token,
  configuration
}: BotToken & { configuration: MenuConfiguration }): Promise<void> {
  const response = await POST(`${getTelegramBaseUrl({ token })}/setMyCommands`, {
    commands: configuration.commands
  });
}
