import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

jest.unstable_mockModule('@packages/loops/registerScout', () => ({
  registerScout: jest.fn()
}));

jest.unstable_mockModule('@packages/beehiiv/registerScout', () => ({
  registerScout: jest.fn()
}));

const { updateUserEmailSettings } = await import('../updateUserEmailSettings');
const { registerScout: registerLoops } = await import('@packages/loops/registerScout');
const { registerScout: registerBeehiiv } = await import('@packages/beehiiv/registerScout');

describe('updateUserEmailSettings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update scout email and register with Loops and Beehiv', async () => {
    const scout = await prisma.scout.create({
      data: {
        displayName: 'test',
        referralCode: `test${Math.random()}`,
        path: `test${Math.random()}`,
        // test-related
        email: null,
        sendMarketing: false,
        sendTransactionEmails: false
      }
    });
    const mockNewEmail = 'newemail@example.com';

    await updateUserEmailSettings({
      userId: scout.id,
      email: mockNewEmail,
      sendMarketing: true,
      sendTransactionEmails: true
    });

    // Verify scout was updated in database
    const updatedScout = await prisma.scout.findUniqueOrThrow({
      where: { id: scout.id }
    });
    expect(updatedScout.email).toBe(mockNewEmail);
    expect(updatedScout.sendMarketing).toBe(true);
    expect(updatedScout.sendTransactionEmails).toBe(true);

    // Verify Loops was called
    expect(registerLoops).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockNewEmail
      }),
      expect.any(String)
    );

    // Verify Beehiv was called
    expect(registerBeehiiv).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockNewEmail
      })
    );
  });

  it('should throw an error if the email is invalid', async () => {
    await expect(
      updateUserEmailSettings({
        userId: '1',
        email: 'invalid-email',
        sendMarketing: true,
        sendTransactionEmails: true
      })
    ).rejects.toThrow('Email is invalid');
  });
});
