import { whitelistedFids, getAdminUser } from '../getAdminUser';

describe('getAdminUser', () => {
  it('should return a user if the fid is whitelisted', async () => {
    const user = await getAdminUser({ fid: whitelistedFids[0] });
    expect(user).toBeDefined();
  });

  it('should return null if the fid is not whitelisted', async () => {
    const user = await getAdminUser({ fid: 123 });
    expect(user).toBeNull();
  });
});
