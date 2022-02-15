import { useWeb3React } from '@web3-react/core';
import { ReactNode, createContext, useContext, useEffect, useMemo } from 'react';
import { LoggedInUser } from 'models';
import { activeUser } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

type IContext = [user: LoggedInUser | null, setUser: (user: LoggedInUser | any) => void];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined]);

export function UserProvider ({ children }: { children: ReactNode }) {

  const { account } = useWeb3React();
  useEffect(() => {
    if (account) {
      console.log('Query user');

    }
  }, [account]);
  const [user, setUser] = useLocalStorage<LoggedInUser>('profile', activeUser);
  // @ts-ignore - backwards compatibility
  user.addresses = user.addresses || [user.address];
  user.linkedAddressesCount = user.addresses.length;
  const value = useMemo(() => [user, setUser] as const, [user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
