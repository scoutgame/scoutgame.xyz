import { prisma, type ConnectWaitlistSlot } from '@charmverse/core/prisma-client';

import { refreshUserScore } from './refreshUserScore';

type WaitlistJoinRequest = {
  fid: number | string;
  referredByFid?: number | string | null;
  username: string;
};

export async function joinWaitlist({ fid, username, referredByFid }: WaitlistJoinRequest): Promise<{
  waitlistSlot: ConnectWaitlistSlot;
  isNew: boolean;
}> {
  const parsedFid = parseInt(fid.toString(), 10);

  const existingSlot = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid: parsedFid
    }
  });

  if (existingSlot) {
    return {
      waitlistSlot: existingSlot,
      isNew: false
    };
  }

  const newSlot = await prisma.connectWaitlistSlot.create({
    data: {
      fid: parsedFid,
      username,
      referredByFid: referredByFid ? parseInt(referredByFid.toString(), 10) : null,
      score: 0
    }
  });

  if (referredByFid) {
    await refreshUserScore({ fid: parsedFid });
  }

  return {
    waitlistSlot: newSlot,
    isNew: true
  };
}
