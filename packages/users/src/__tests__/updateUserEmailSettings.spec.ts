import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

const { updateUserEmailSettings } = await import('../updateUserEmailSettings');

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
        email: null
      }
    });
    const mockNewEmail = 'newemail@example.com';

    await updateUserEmailSettings({
      userId: scout.id,
      email: mockNewEmail
    });

    // Verify scout was updated in database
    const updatedScout = await prisma.scout.findUniqueOrThrow({
      where: { id: scout.id }
    });
    expect(updatedScout.email).toBe(mockNewEmail);
  });

  it('should throw an error if the email is invalid', async () => {
    await expect(
      updateUserEmailSettings({
        userId: '1',
        email: 'invalid-email'
      })
    ).rejects.toThrow('Email is invalid');
  });
});
