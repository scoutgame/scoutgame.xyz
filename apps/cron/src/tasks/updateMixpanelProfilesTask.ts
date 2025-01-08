import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';
import { batchUpdateMixpanelUserProfiles } from '@packages/mixpanel/updateUserProfile';
import type { MixPanelUserProfile } from '@packages/mixpanel/updateUserProfile';
import { isWithinLastDays } from '@packages/utils/dates';

const perBatch = 1000;

async function getUsers({ offset = 0 }: { offset?: number } = {}): Promise<
  { userId: string; profile: MixPanelUserProfile }[]
> {
  const scouts = await prisma.scout.findMany({
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    },
    include: {
      events: {
        where: {
          type: 'referral'
        }
      }
    }
  });
  return scouts.map((user) => ({
    userId: user.id,
    profile: {
      $name: user.displayName,
      $email: user.email,
      path: user.path!,
      deleted: !!user.deletedAt,
      deletedAt: user.deletedAt,
      onboarded: !!user.onboardedAt,
      'Agreed To TOS': !!user.agreedToTermsAt,
      'Enable Marketing': user.sendMarketing,
      'Builder Status': user.builderStatus,
      createdAt: user.createdAt,
      onboardedAt: user.agreedToTermsAt,
      referrals: user.events.filter((e) => e.type === 'referral').length
    }
  }));
}

async function updateMixpanelUserProfiles({
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

  await deleteMixpanelProfiles(usersToDelete.map((user) => ({ id: user.userId })))
    .catch((_error) => {
      log.error('Failed to delete user profiles in Mixpanel', { error: _error });
    })
    .then((data) => {
      log.info(`Deleted ${usersToDelete.length} users in Mixpanel`, { data });
    });

  if (users.length > 0) {
    log.debug(`Processed ${users.length} users in Mixpanel. Total processed: ${total}`);

    return updateMixpanelUserProfiles({ offset: offset + perBatch, total });
  }
  return total;
}

export async function updateMixpanelUserProfilesTask(): Promise<void> {
  const totalProcessed = await updateMixpanelUserProfiles();
  log.info(`Updated ${totalProcessed} users in Mixpanel`);
}
