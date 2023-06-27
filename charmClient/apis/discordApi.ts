import type { Space, User } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import type { LoggedInUser } from 'models';
import type { ConnectDiscordPayload, ConnectDiscordResponse } from 'pages/api/discord/connect';
import type { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';

export class DiscordApi {
  disconnectDiscord() {
    return http.POST<User>('/api/discord/disconnect');
  }

  connectDiscord(payload: ConnectDiscordPayload) {
    return http.POST<ConnectDiscordResponse>('/api/discord/connect', payload);
  }

  importRolesFromDiscordServer(payload: ImportDiscordRolesPayload) {
    return http.POST<ImportRolesResponse>('/api/discord/importRoles', payload);
  }

  checkDiscordGate(spaceDomain: string) {
    return http.GET<CheckDiscordGateResult>(`/api/discord/gate?spaceDomain=${spaceDomain}`);
  }

  verifyDiscordGate(body: { joinType?: string; spaceId: string }) {
    return http.POST<Space>('/api/discord/gate/verify', body);
  }

  loginWithDiscordCode(code: string, type: 'login' | 'connect') {
    const state = encodeURIComponent(
      JSON.stringify({
        type
      })
    );

    return http.POST<LoggedInUser>(`/api/discord/login?state=${state}`, { code });
  }
}
