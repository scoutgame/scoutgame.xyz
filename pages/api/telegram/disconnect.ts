import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { IDENTITY_TYPES, IdentityType } from 'models';
import { DiscordAccount } from 'lib/discord/getDiscordAccount';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectTelegram);

async function disconnectTelegram (req: NextApiRequest, res: NextApiResponse) {
  await prisma.telegramUser.delete({
    where: {
      userId: req.session.user.id
    }
  });

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      discordUser: true
    }
  });

  if (!user) {
    return res.status(400).json({
      error: 'User does not exist'
    });
  }

  // If identity type is not Telegram
  if (user.identityType !== IDENTITY_TYPES[2]) {
    res.status(200).json({ success: 'ok' });
  }

  let newUserName: string;
  let newIdentityProvider: IdentityType;

  if (user.discordUser
    && user.discordUser.account
    && (user.discordUser.account as Partial<DiscordAccount>).username
  ) {
    const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
    // Already checked that there is a username
    newUserName = discordAccount.username || '';
    newIdentityProvider = IDENTITY_TYPES[1];
  }
  else {
    newUserName = user.addresses[0];
    newIdentityProvider = IDENTITY_TYPES[0];
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      username: newUserName,
      identityType: newIdentityProvider
    }
  });

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
