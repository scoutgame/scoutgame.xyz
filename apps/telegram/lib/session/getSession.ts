import { getSession as getSessionBase } from '@packages/nextjs/session/getSession';

export const getSession = () => {
  return getSessionBase({ sameSite: 'none' });
};
