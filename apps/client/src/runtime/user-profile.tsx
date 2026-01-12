import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type UserProfile = {
  userId: string;
};

const defaultProfile: UserProfile = {
  userId: '6f9a2c1b-0c4d-4f8f-8b0a-1a2b3c4d5e6f',
};

const UserProfileContext = createContext<UserProfile>(defaultProfile);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  return (
    <UserProfileContext.Provider value={defaultProfile}>{children}</UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
