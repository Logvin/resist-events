// JWT verification for Cloudflare Access tokens
// Uses Web Crypto API (no npm dependencies)

let cachedJwks = null;
let cachedJwksTime = 0;
const JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    return payload;
  } catch {
    return null;
  }
}

async function fetchJwks(teamDomain) {
  const now = Date.now();
  if (cachedJwks && (now - cachedJwksTime) < JWKS_CACHE_TTL) {
    return cachedJwks;
  }

  const url = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  const data = await res.json();
  cachedJwks = data;
  cachedJwksTime = now;
  return data;
}

async function importRsaKey(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: 'RS256',
      ext: true,
    },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

async function verifySignature(token, key) {
  const parts = token.split('.');
  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecode(parts[2]);
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    signatureInput
  );
}

/**
 * Verify a Cloudflare Access JWT token.
 * @param {Request} request - The incoming request
 * @param {string} teamDomain - CF Access team domain (e.g. "myteam")
 * @param {string} aud - Expected audience (CF Access application AUD tag)
 * @returns {object|null} Decoded payload if valid, null otherwise
 */
export async function verifyAccessJWT(request, teamDomain, aud) {
  try {
    // Read JWT from CF_Authorization cookie
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const match = cookieHeader.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
    if (!match) return null;

    const token = match[1];
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    // Validate claims
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    if (aud && payload.aud) {
      const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audArray.includes(aud)) return null;
    }
    const expectedIssuer = `https://${teamDomain}.cloudflareaccess.com`;
    if (payload.iss && payload.iss !== expectedIssuer) return null;

    // Fetch JWKS and find matching key
    const jwks = await fetchJwks(teamDomain);
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(token.split('.')[0])));

    let verified = false;
    for (const key of (jwks.keys || [])) {
      if (key.kid && header.kid && key.kid !== header.kid) continue;
      if (key.kty !== 'RSA') continue;
      try {
        const cryptoKey = await importRsaKey(key);
        if (await verifySignature(token, cryptoKey)) {
          verified = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!verified) return null;
    return payload;
  } catch (e) {
    console.error('JWT verification failed:', e.message);
    return null;
  }
}
