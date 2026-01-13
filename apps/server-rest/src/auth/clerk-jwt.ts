import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type ClerkJwtClaims = JWTPayload & {
  sub?: string;
  user_id?: string;
};

type VerifiedClerkJwt = {
  userId: string;
  claims: ClerkJwtClaims;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const resolveJwksUrl = (): string => {
  const issuer = process.env.CLERK_JWT_ISSUER;
  if (process.env.CLERK_JWKS_URL) {
    return process.env.CLERK_JWKS_URL;
  }
  if (issuer) {
    return `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
  }
  throw new Error('Missing CLERK_JWKS_URL or CLERK_JWT_ISSUER');
};

const resolveJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(resolveJwksUrl()));
  }
  return jwks;
};

const resolveUserId = (claims: ClerkJwtClaims): string => {
  if (typeof claims.sub === 'string') {
    return claims.sub;
  }
  if (typeof claims.user_id === 'string') {
    return claims.user_id;
  }
  throw new Error('Missing user id claim');
};

export async function verifyClerkJwt(token: string): Promise<VerifiedClerkJwt> {
  const issuer = process.env.CLERK_JWT_ISSUER;
  const { payload } = await jwtVerify(token, resolveJwks(), issuer ? { issuer } : undefined);
  const claims = payload as ClerkJwtClaims;
  return {
    userId: resolveUserId(claims),
    claims,
  };
}
