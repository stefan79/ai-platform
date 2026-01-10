import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type UserProfile = {
  userId: string;
};

const defaultProfile: UserProfile = {
  userId: 'ce9a8edc-e5b1-40bc-bd3a-910b000af55a',
};

const UserProfileContext = createContext<UserProfile>(defaultProfile);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  return (
    <UserProfileContext.Provider value={defaultProfile}>{children}</UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
