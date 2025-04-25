import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { baseUrl } from '@packages/utils/constants';

type Result =
  | 'already_referred'
  | 'already_referred_as_another_user'
  | 'not_verified'
  | 'not_referred'
  | 'no_nft_purchase'
  | 'success';

export async function updateReferralUsers(refereeId: string, now = new Date()): Promise<{ result: Result }> {
  const referee = await prisma.scout.findUniqueOrThrow({
    where: {
      id: refereeId,
      deletedAt: null
    },
    select: {
      email: true,
      emailVerifications: true,
      displayName: true,
      path: true,
      wallets: {
        where: {
          scoutedNfts: {
            some: {
              builderNft: {
                nftType: 'default'
              }
            }
          }
        },
        take: 1
      }
    }
  });

  if (referee.wallets.length === 0) {
    log.debug('Ignore referral because referee has not purchased any NFTs', { userId: refereeId });
    return { result: 'no_nft_purchase' };
  }

  // find scouts with similar email
  const _similarEmailScouts = await prisma.scout.findMany({
    where: {
      email: {
        mode: 'insensitive',
        startsWith: referee.email?.split('@')[0].split('+')[0],
        endsWith: `@${referee.email?.split('@')[1]}`
      }
    },
    select: {
      email: true,
      id: true
    }
  });
  // handle exceptions in the query logic above.
  // For example: 'matteo@gmail.com' and 'matt+test@gmail.com' both start with 'matt'
  const similarEmailScouts = _similarEmailScouts.filter((s) => isSimilarEmail(s.email!, referee.email!));

  const referralCodeEvents = await prisma.referralCodeEvent.findMany({
    where: {
      refereeId: {
        in: [refereeId, ...similarEmailScouts.map((s) => s.id)]
      }
    },
    select: {
      id: true,
      completedAt: true,
      refereeId: true,
      builderEvent: {
        select: {
          builder: {
            select: {
              id: true,
              path: true,
              displayName: true,
              referralCode: true
            }
          }
        }
      }
    }
  });

  const alreadyReferred = referralCodeEvents.find((e) => !!e.completedAt);

  if (alreadyReferred) {
    log.debug('Ignore referral because referee has already been referred', {
      previousReferredUserId: alreadyReferred.refereeId,
      userId: refereeId
    });
    if (alreadyReferred.refereeId === refereeId) {
      return { result: 'already_referred' };
    }
    return { result: 'already_referred_as_another_user' };
  }

  const referralCodeEvent = referralCodeEvents[0];

  if (!referralCodeEvent) {
    // The user was not referred
    return { result: 'not_referred' };
  }

  if (referralCodeEvents.length > 1) {
    log.debug('Unexpected state: referee has multiple referral events', { userId: refereeId });
  }

  if (!referee.emailVerifications.some((e) => !!e.completedAt)) {
    log.debug('Ignore referral because referee has not verified their email', { userId: refereeId });
    return { result: 'not_verified' };
  }

  const referrer = await prisma.$transaction(
    async (tx) => {
      await tx.referralCodeEvent.update({
        where: {
          id: referralCodeEvent.id
        },
        data: {
          completedAt: now
        }
      });

      trackUserAction('referral_link_used', {
        userId: refereeId,
        referralCode: referralCodeEvent.builderEvent.builder.referralCode,
        referrerPath: referralCodeEvent.builderEvent.builder.path
      });

      return referralCodeEvent.builderEvent.builder;
    },
    {
      timeout: 10000
    }
  );

  try {
    await sendEmailNotification({
      userId: referrer.id,
      senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
      notificationType: 'referral_link_signup',
      templateVariables: {
        name: referrer.displayName,
        scout_name: referee.displayName,
        scout_profile_link: `https://scoutgame.xyz/u/${referee.path}`
      }
    });
  } catch (error) {
    log.error('Error sending referral email', { error, userId: referrer.id });
  }

  return { result: 'success' };
}

function isSimilarEmail(email1: string, email2: string) {
  return email1.split('@')[0].split('+')[0].toLowerCase() === email2.split('@')[0].split('+')[0].toLowerCase();
}
