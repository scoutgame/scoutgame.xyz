import type { User, UserOTP } from '@charmverse/core/prisma-client';
import * as OTPAuth from 'otpauth';

/**
 * Create an otp for the user to scan a QR code or enter the code manually
 * @param user User & { userOTP?: UserOTP | null }
 * @returns The code and the uri
 */
export function createOtp(user: User & { userOTP?: UserOTP | null }) {
  const secret = new OTPAuth.Secret({ size: 10 });

  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: user.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: user.userOTP?.secret || secret.base32
  });

  const uri = totp.toString();

  const code = OTPAuth.URI.parse(uri).secret.base32;

  return {
    code,
    uri
  };
}
