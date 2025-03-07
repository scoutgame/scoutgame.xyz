import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockScout } from '@packages/testing/database';

jest.unstable_mockModule('@packages/mailer/sendEmailNotification', () => ({
  sendEmailNotification: jest.fn()
}));

const { sendVerificationEmail, verifyEmail } = await import('../verifyEmail');
const { sendEmailNotification } = await import('@packages/mailer/sendEmailNotification');

describe('verifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create verification code and send email', async () => {
    const scout = await mockScout();

    await sendVerificationEmail({ userId: scout.id });

    // Verify code was created
    const verification = await prisma.scoutEmailVerification.findFirst({
      where: { scoutId: scout.id }
    });
    expect(verification).toBeTruthy();
    expect(verification?.code).toBeDefined();
    expect(verification?.email).toBe(scout.email);
    expect(verification?.scoutId).toBe(scout.id);
    expect(verification?.completedAt).toBeNull();

    // Verify email was sent
    expect(sendEmailNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: scout.id,
        notificationType: 'email_verification'
      })
    );
  });

  it('should verify email with valid code', async () => {
    const scout = await mockScout();

    const code = await sendVerificationEmail({ userId: scout.id });

    const { result } = await verifyEmail(code);
    expect(result).toBe('verified');

    // Verify verification was marked as completed
    const verification = await prisma.scoutEmailVerification.findFirst({
      where: { code }
    });
    expect(verification?.completedAt).toBeTruthy();
  });

  it('should handle already completed verification', async () => {
    const scout = await mockScout();

    const code = await sendVerificationEmail({ userId: scout.id });

    await prisma.scoutEmailVerification.update({
      where: { code },
      data: {
        completedAt: new Date()
      }
    });

    const { result } = await verifyEmail(code);
    expect(result).toBe('already_verified');
  });
});
