import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { IDENTITY_TYPES, IdentityType } from 'models';
import { TelegramAccount } from 'pages/api/telegram/connect';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectDiscord);

async function disconnectDiscord (req: NextApiRequest, res: NextApiResponse) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      telegramUser: true
    }
  });

  if (!user) {
    return res.status(400).json({
      error: 'Invalid user id'
    });
  }

  if (user.addresses.length === 0) {
    return res.status(400).json({
      error: 'You must have at least a single address'
    });
  }

  await prisma.discordUser.delete({
    where: {
      userId: req.session.user.id
    }
  });

  // If identity type is not Discord
  if (user.identityType !== IDENTITY_TYPES[1]) {
    res.status(200).json({ success: 'ok' });
  }

  let newUserName: string;
  let newIdentityProvider: IdentityType;

  if (user.telegramUser) {
    const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
    newUserName = telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`;
    newIdentityProvider = IDENTITY_TYPES[2];
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
