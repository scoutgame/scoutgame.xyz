import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import * as http from 'adapters/http';
import { prisma } from 'db';
import { getDiscordToken } from 'lib/discord/getDiscordToken';
import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { createRolesFromDiscord } from 'lib/role/createRolesFromDiscord';
import { assignRolesFromDiscord } from 'lib/role/assignRolesFromDiscord';
import { Prisma, DiscordUser as PrismaDiscordUser } from '@prisma/client';
import { DiscordGuildMember, DiscordServerRole } from './importRoles';

const handler = nc({
  onError,
  onNoMatch
});

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar?: string
  verified?: boolean
  bot?: boolean
}

export interface ConnectDiscordPayload {
  code: string
  spaceId: string
}

export interface ConnectDiscordResponse {
  discordUser: PrismaDiscordUser,
  avatar: string | null,
  username: string | null
}

// TODO: Add nonce for oauth state
async function connectDiscord (req: NextApiRequest, res: NextApiResponse<ConnectDiscordResponse | {error: string}>) {
  const { code, spaceId } = req.body as ConnectDiscordPayload;
  if (!code || !spaceId) {
    res.status(400).json({
      error: 'Invalid parameters'
    });
    return;
  }

  try {
    const token = await getDiscordToken(code, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
    const discordAccount = await http.GET<DiscordUser>('https://discord.com/api/v8/users/@me', undefined, {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });
    const { id, ...rest } = discordAccount;
    const userId = req.session.user.id;

    try {
      const discordUser = await prisma.discordUser.create({
        data: {
          account: rest as any,
          discordId: id,
          user: {
            connect: {
              id: userId
            }
          }
        }
      });

      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          username: discordAccount.username,
          avatar: `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png`
        }
      });

      // Get the discord guild attached with the spaceId
      const charmverseSpace = await prisma.space.findUnique({
        where: {
          id: spaceId
        }
      });

      // If the workspace is connected with a discord server
      if (charmverseSpace?.discordServerId) {
        // Get all the roles from the discord server
        const discordServerRolesResponse = await handleDiscordResponse<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${charmverseSpace.discordServerId}/roles`);
        if (discordServerRolesResponse.status === 'success') {
          const discordServerRoles = discordServerRolesResponse.data;
          const { rolesRecord } = await createRolesFromDiscord(discordServerRoles, spaceId, req.session.user.id);
          const guildMemberResponse = await handleDiscordResponse<DiscordGuildMember>(`https://discord.com/api/v8/guilds/${charmverseSpace.discordServerId}/members/${id}`);

          if (guildMemberResponse.status === 'success') {
            await assignRolesFromDiscord(rolesRecord, [guildMemberResponse.data], spaceId);
          }
        }
      }

      res.status(200).json({
        discordUser,
        avatar: rest.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : null,
        username: rest.username
      });
    }
    catch (err) {
      console.log(err);
      // If the discord user is already connected to a charmverse account this code will be run
      res.status(400).json({
        error: 'Connection to Discord failed. Another CharmVerse account is already associated with this Discord account.'
      });
    }
  }
  catch (_) {
    res.status(400).json({
      error: 'Invalid token'
    });
  }
}

handler.use(requireUser).post(connectDiscord);

export default withSessionRoute(handler);
