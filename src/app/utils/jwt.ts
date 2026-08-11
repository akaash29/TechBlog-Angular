/** Decodes a JWT's payload without verifying its signature — safe here
 *  because the token just arrived fresh from our own backend over
 *  HTTPS; the app never trusts a token it didn't just receive. Works
 *  in both the browser (atob) and during SSR (Buffer), since Node has
 *  no atob. */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const segment = token.split('.')[1];
  if (!segment) return null;

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** ASP.NET Core writes these long URIs as the JWT claim keys by default
 *  (System.Security.Claims.ClaimTypes), rather than short names —
 *  see JwtTokenService.GenerateAccessToken on the API side. Role is
 *  on a different domain (schemas.microsoft.com) than the rest
 *  (schemas.xmlsoap.org) — that's .NET's own inconsistency, not a typo. */
export const DOTNET_CLAIM_TYPES = {
  nameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
} as const;
