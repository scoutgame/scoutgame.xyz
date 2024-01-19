import { log } from '@charmverse/core/dist/cjs/lib/log';
import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export type CreateOtpResponse = {
  code: string;
  uri: string;
  recoveryCode: string;
};

/**
 * Delete user OTP
 * @param userId string
 * @returns void
 */
export async function deleteUserOtp(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      otp: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  if (!user.otp) {
    throw new DataNotFoundError('User does not have otp configured');
  }

  await prisma.otp.delete({
    where: {
      userId
    }
  });

  log.info(`User ${userId} deleted his otp`);
}
