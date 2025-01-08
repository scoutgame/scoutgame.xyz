import { sendEmail } from '@charmverse/core/email';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

import { createEmailVerification, verifyEmail, InvalidVerificationError } from '../verifyEmail';

jest.mock('@charmverse/core/email', () => ({
  sendEmail: jest.fn()
}));

describe('email verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create verification code and send email', async () => {
    const scout = await prisma.scout.create({
      data: {
        displayName: 'test',
        path: `test${Math.random()}`,
        referralCode: `test${Math.random()}`
      }
    });

    const email = 'test@example.com';
    const code = await createEmailVerification(scout.id, email);

    // Verify code was created
    const verification = await prisma.scoutEmailVerification.findFirst({
      where: { code }
    });
    expect(verification).toBeTruthy();
    expect(verification?.email).toBe(email);
    expect(verification?.scoutId).toBe(scout.id);
    expect(verification?.completedAt).toBeNull();

    // Verify email was sent
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: 'Verify your email'
      })
    );
  });

  it('should verify email with valid code', async () => {
    const scout = await prisma.scout.create({
      data: {
        displayName: 'test',
        path: `test${Math.random()}`,
        referralCode: `test${Math.random()}`
      }
    });

    const email = 'test@example.com';
    const code = await createEmailVerification(scout.id, email);

    const updatedScout = await verifyEmail(code);
    expect(updatedScout.email).toBe(email);

    // Verify verification was marked as completed
    const verification = await prisma.scoutEmailVerification.findFirst({
      where: { code }
    });
    expect(verification?.completedAt).toBeTruthy();
  });

  it('should throw error for already completed verification', async () => {
    const scout = await prisma.scout.create({
      data: {
        displayName: 'test',
        path: `test${Math.random()}`,
        referralCode: `test${Math.random()}`
      }
    });

    const email = 'test@example.com';
    const code = 'test-code';

    await prisma.scoutEmailVerification.create({
      data: {
        code,
        email,
        scoutId: scout.id,
        completedAt: new Date() // Already completed
      }
    });

    await expect(verifyEmail(code)).rejects.toThrow(InvalidVerificationError);
  });
});
