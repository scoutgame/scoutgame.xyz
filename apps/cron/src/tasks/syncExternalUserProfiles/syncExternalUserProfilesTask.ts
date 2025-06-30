import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { batchUpdateMixpanelUserProfiles } from '@packages/mixpanel/updateUserProfile';
import type { MixPanelUserProfile } from '@packages/mixpanel/updateUserProfile';
import { DateTime } from 'luxon';

import { deleteExternalProfiles } from './deleteExternalProfiles';

const perBatch = 1000;

const deletedAtLookbackHours = 2; // job runs once an hour, 2 hours gives a little overlap

async function getUsers({ offset = 0 }: { offset?: number } = {}): Promise<
  { userId: string; profile: MixPanelUserProfile }[]
> {
  const scouts = await prisma.scout.findMany({
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    },
    where: {
      OR: [
        { deletedAt: null },
        // look for recently deleted users
        { deletedAt: { gt: DateTime.now().minus({ hours: deletedAtLookbackHours }).toJSDate() } }
      ]
    },
    include: {
      events: {
        where: {
          type: 'referral'
        }
      },
      emailVerifications: {
        where: {
          completedAt: {
            not: null
          }
        }
      },
      userSeasonStats: {
        select: {
          nftsPurchased: true
        }
      },
      socialQuests: {
        select: {
          completedAt: true
        }
      }
    }
  });
  return scouts.map((user) => ({
    userId: user.id,
    profile: {
      $name: user.displayName,
      $email: user.email,
      path: user.path,
      deleted: !!user.deletedAt,
      onboarded: !!user.onboardedAt,
      'Agreed To TOS': !!user.agreedToTermsAt,
      'Builder Status': user.builderStatus,
      createdAt: user.createdAt,
      onboardedAt: user.agreedToTermsAt,
      referrals: user.events.filter((e) => e.type === 'referral').length,
      'Verified Email': !!user.emailVerifications.length,
      'Purchased NFT': !!user.userSeasonStats.filter((stat) => stat.nftsPurchased).length,
      'Completed Social Quest': user.socialQuests.length > 0
    }
  }));
}

async function syncExternalUserProfilesRecursively({
  offset = 0,
  total = 0
}: {
  offset?: number;
  total?: number;
} = {}): Promise<number> {
  const users = await getUsers({ offset });

  total += users.length;

  // Update user profiles
  await batchUpdateMixpanelUserProfiles(users);

  // Delete user profiles for users that are deleted in our system
  const usersToDelete = users.filter((user) => user.profile.deleted);
  await deleteExternalProfiles(usersToDelete.map((user) => ({ id: user.userId, email: user.profile.$email })))
    .catch((_error) => {
      log.error('Failed to delete user profiles in Mixpanel', { error: _error });
    })
    .then((data) => {
      log.info(`Deleted ${usersToDelete.length} users in Mixpanel`, { data });
    });

  if (users.length > 0) {
    log.debug(`Processed ${users.length} users in Mixpanel. Total to process: ${total}`);

    return syncExternalUserProfilesRecursively({ offset: offset + perBatch, total });
  }
  return total;
}

export async function syncExternalUserProfilesTask(): Promise<void> {
  const totalProcessed = await syncExternalUserProfilesRecursively();
  log.info(`Updated ${totalProcessed} users in Mixpanel`);
}
