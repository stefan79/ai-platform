import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

type JwtClaims = {
  sub?: string;
  user_id?: string;
  [key: string]: unknown;
};

export type UserProfile = {
  userId?: string;
  claims?: JwtClaims;
  getToken: () => Promise<string | null>;
};

const defaultProfile: UserProfile = {
  userId: undefined,
  claims: undefined,
  getToken: async () => null,
};

const UserProfileContext = createContext<UserProfile>(defaultProfile);

const decodeJwtPayload = (token: string): JwtClaims | undefined => {
  const [, payload] = token.split('.');
  if (!payload) {
    return undefined;
  }
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return undefined;
  }
};

const resolveUserId = (claims?: JwtClaims): string | undefined => {
  if (!claims) {
    return undefined;
  }
  if (typeof claims.sub === 'string') {
    return claims.sub;
  }
  if (typeof claims.user_id === 'string') {
    return claims.user_id;
  }
  return undefined;
};

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [claims, setClaims] = useState<JwtClaims | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const loadClaims = async () => {
      const token = await getToken();
      if (!active) {
        return;
      }
      setClaims(token ? decodeJwtPayload(token) : undefined);
    };
    void loadClaims();
    return () => {
      active = false;
    };
  }, [getToken]);

  const profile = useMemo<UserProfile>(
    () => ({
      userId: resolveUserId(claims),
      claims,
      getToken,
    }),
    [claims, getToken],
  );

  return <UserProfileContext.Provider value={profile}>{children}</UserProfileContext.Provider>;
}

export const useUserProfile = () => useContext(UserProfileContext);
