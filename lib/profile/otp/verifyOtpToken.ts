import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import * as OTPAuth from 'otpauth';

import { decryptString } from './stringEncryption';

export async function verifyOtpToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      userOTP: {
        select: {
          secret: true
        }
      }
    }
  });

  if (!user?.userOTP) {
    throw new InvalidInputError('User OTP does not exist');
  }

  const decryptedSecret = decryptString(user.userOTP.secret);

  const delta = validateToken(decryptedSecret, token, user.username);

  if (delta === null) {
    throw new InvalidInputError('Invalid token');
  }
}

function validateToken(secret: string, token: string, username: string) {
  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret
  });

  // token must be a string in order to work
  const delta = totp.validate({ token, window: 1 });

  return delta;
}
