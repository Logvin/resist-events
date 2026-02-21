// Middleware: CORS + auth (Cloudflare Access JWT or demo cookie)

import { verifyAccessJWT } from './_jwt.js';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [key, ...val] = c.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(val.join('='));
  });
  return cookies;
}

export async function onRequest(context) {
  const { request } = context;

  // Determine allowed origin: explicit env var, or same-origin only
  const allowedOrigin = context.env.ALLOWED_ORIGIN || null;
  const requestOrigin = request.headers.get('Origin') || '';
  const corsOrigin = allowedOrigin
    ? (requestOrigin === allowedOrigin ? allowedOrigin : null)
    : null;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
    if (corsOrigin) {
      headers['Access-Control-Allow-Origin'] = corsOrigin;
      headers['Vary'] = 'Origin';
    }
    return new Response(null, { headers });
  }

  context.data = context.data || {};
  context.data.skipSetupWizard = context.env.SKIP_SETUP_WIZARD === 'true';
  context.data.demoModeEmail = context.env.DEMO_MODE_EMAIL || null;

  const cfAccessAud = context.env.CF_ACCESS_AUD;
  // Sanitize team domain: strip ".cloudflareaccess.com" suffix if user included it
  const rawTeamDomain = context.env.CF_ACCESS_TEAM_DOMAIN || '';
  const cfAccessTeamDomain = rawTeamDomain.replace(/\.cloudflareaccess\.com$/i, '') || null;

  if (cfAccessAud && cfAccessTeamDomain) {
    // ===== LIVE AUTH MODE (Cloudflare Access JWT) =====
    context.data.authMode = 'live';
    context.data.jwtEmail = null;
    context.data.demoRole = 'guest';
    context.data.demoUserId = null;

    // Check for app-level logout flag — skip JWT auth if user has logged out
    const cookieHeader = request.headers.get('Cookie');
    const cookies = parseCookies(cookieHeader);
    if (cookies.resist_logged_out === '1') {
      // User is logged out at app level — treat as guest
    } else {
      try {
        const payload = await verifyAccessJWT(request, cfAccessTeamDomain, cfAccessAud);
        if (payload && payload.email) {
          context.data.jwtEmail = payload.email;

          // Look up user in DB by email
          const db = context.env.RESIST_DB;
          const user = await db.prepare(
            'SELECT u.id, u.role, u.org_id, u.display_name, o.name AS org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.email = ?'
          ).bind(payload.email).first();

          if (user) {
            // Check if user is archived — if so, treat as guest
            const archivedCheck = await db.prepare(
              "SELECT 1 FROM archived_items WHERE item_type = 'user' AND item_id = ? LIMIT 1"
            ).bind(user.id).first();

            if (archivedCheck) {
              // User is archived — treat as guest
            } else {
              context.data.demoRole = user.role;
              context.data.demoUserId = user.id;
              context.data.liveOrgId = user.org_id;
              context.data.liveOrgName = user.org_name || '';
              context.data.liveDisplayName = user.display_name || '';
            }
          }
          // If no user found in DB, they stay as guest
        }
      } catch (e) {
        console.error('JWT auth error:', e.message);
        // Fall through as guest
      }
    }
  } else {
    // ===== DEMO MODE (cookie-based) =====
    context.data.authMode = 'demo';
    context.data.jwtEmail = null;

    const cookieHeader = request.headers.get('Cookie');
    const cookies = parseCookies(cookieHeader);
    context.data.demoRole = cookies.demo_role || null;
    context.data.demoUserId = cookies.demo_user_id ? parseInt(cookies.demo_user_id) : null;
  }

  // Continue to next handler
  const response = await context.next();

  // Add CORS headers to response (only if origin is allowed)
  const newResponse = new Response(response.body, response);
  if (corsOrigin) {
    newResponse.headers.set('Access-Control-Allow-Origin', corsOrigin);
    newResponse.headers.set('Vary', 'Origin');
  }
  return newResponse;
}
