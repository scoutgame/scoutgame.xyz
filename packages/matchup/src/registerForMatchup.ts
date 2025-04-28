import { prisma } from '@charmverse/core/prisma-client';
import { getNextWeek, getWeekFromDate } from '@packages/dates/utils';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { DateTime } from 'luxon';

import { REGISTRATION_DAY_OF_WEEK, MATCHUP_REGISTRATION_FEE } from './config';

// scouts can only register for a matchup in the next week, unless it is Monday of the current week
export function isValidRegistrationWeek(week: string, now = DateTime.utc()) {
  const currentWeek = getWeekFromDate(now.toJSDate());
  const nextWeek = getNextWeek(currentWeek);
  const currentDay = now.weekday;
  return currentDay === REGISTRATION_DAY_OF_WEEK ? week === currentWeek : week === nextWeek;
}

export async function registerForMatchup({
  scoutId,
  week,
  tx,
  decentTx
}: {
  scoutId: string;
  week: string;
  tx?: { chainId: number; hash: string };
  decentTx?: { chainId: number; hash: string };
}) {
  let decentRegistrationTxId: string | undefined;
  let registrationTxId: string | undefined;
  if (decentTx) {
    const decentRegistrationTx = await prisma.blockchainTransaction.create({
      data: {
        chainId: decentTx.chainId,
        hash: decentTx.hash,
        status: 'pending' as const
      }
    });
    decentRegistrationTxId = decentRegistrationTx.id;
  }
  if (tx) {
    const registrationTx = await prisma.blockchainTransaction.create({
      data: {
        chainId: tx.chainId,
        hash: tx.hash,
        status: 'success' as const
      }
    });
    registrationTxId = registrationTx.id;
  }
  return prisma.scoutMatchup.create({
    data: {
      createdBy: scoutId,
      week,
      decentRegistrationTxId,
      registrationTxId
    }
  });
}
