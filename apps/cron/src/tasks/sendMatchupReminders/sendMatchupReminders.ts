import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { getMatchupDetails } from '@packages/matchup/getMatchupDetails';
import { DateTime } from 'luxon';

/**
 * Sends reminder emails to scouts who have registered for matchups but haven't submitted their selections yet
 *
 * if it has been one hour since the matchup was created and registration is open,
 */
export async function sendMatchupReminders(ctx: any, currentWeek = getCurrentWeek(), now = new Date()) {
  const matchupDetails = await getMatchupDetails(currentWeek);

  if (!matchupDetails.registrationOpen) {
    log.info('Registration is not open, skipping matchup reminders', { week: currentWeek });
    return 0;
  }

  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  log.info('Sending matchup reminders for week', { week: currentWeek });

  // Find matchups for current week where submittedAt is null
  const pendingMatchups = await prisma.scoutMatchup.findMany({
    where: {
      createdAt: {
        lte: oneHourAgo
      },
      week: currentWeek,
      submittedAt: null,
      OR: [{ registrationTx: { status: 'success' } }, { freeRegistration: true }]
    },
    select: {
      createdBy: true,
      scout: {
        select: {
          displayName: true,
          email: true
        }
      }
    }
  });

  log.info('Found pending matchup submissions', { count: pendingMatchups.length });

  for (const matchup of pendingMatchups) {
    try {
      // Check if we've already sent a reminder for this matchup
      const existingNotification = await prisma.scoutEmailNotification.findFirst({
        where: {
          userId: matchup.createdBy,
          notificationType: 'matchup_reminder',
          templateVariables: {
            path: ['week'],
            equals: currentWeek
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (existingNotification) {
        log.debug('Reminder already sent for this matchup', {
          userId: matchup.createdBy
        });
        continue;
      }

      // Send reminder email
      await sendEmailNotification({
        userId: matchup.createdBy,
        notificationType: 'matchup_reminder',
        senderAddress: 'Scout Game <no-reply@scoutgame.xyz>',
        templateVariables: {
          time_left: DateTime.fromJSDate(new Date(matchupDetails.startTime)).toRelative() || 'soon', // includes preposition, ex "in 1 hour"
          week: currentWeek
        }
      });

      log.info('Sent matchup reminder', {
        userId: matchup.createdBy
      });
    } catch (error) {
      log.error('Failed to send matchup reminder', {
        error,
        userId: matchup.createdBy
      });
    }
  }

  return pendingMatchups.length;
}
