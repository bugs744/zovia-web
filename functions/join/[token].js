// Cloudflare Pages Function: renders the invite landing page.
// Route: GET /join/:token
//
// Data flow per request:
//   1. Look up ZUserGroup by inviteToken → get space details
//   2. detectAppId(...) picks which Zovia app the invite is for
//   3. Look up ZoviaAppVersions for that app → get brand color, store URLs,
//      display name, tagline (DB is the source of truth for these)
//   4. Merge with app-configs.js platform wiring (URL scheme, Android
//      package name — not in the DB)
//   5. Render the precompiled join-space template
//
// Templates are precompiled at build time — see scripts/build-templates.js.
// This file uses native fetch (no axios) since Cloudflare Workers run V8
// isolates, not Node.

import { renderJoinSpace, renderError } from '../_templates.js';
import { getAppConfigForSpace, detectAppId } from '../../config/app-configs.js';

const PARSE_APP_ID = 'PT5etrzSWIMulTzgbT7jmL7nkt6sa4tdeXgkHJQZ';
const PARSE_REST_KEY = '1NZ4ZGOHphuZxRiC1h48XblSv9I7X7VgWhiky0lO';
const PARSE_SERVER_URL = 'https://parseapi.back4app.com';

const PARSE_HEADERS = {
  'X-Parse-Application-Id': PARSE_APP_ID,
  'X-Parse-REST-API-Key': PARSE_REST_KEY,
  'Content-Type': 'application/json',
};

const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function errorPage(status, title, message) {
  return htmlResponse(renderError({ title, message }, escapeHtml), status);
}

async function fetchParse(path, params) {
  const url = new URL(`${PARSE_SERVER_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  // Cache Parse lookups at the edge — app metadata changes rarely.
  const res = await fetch(url.toString(), {
    headers: PARSE_HEADERS,
    cf: { cacheTtl: 60, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`Parse ${res.status}`);
  return res.json();
}

async function lookupAppVersion(appId) {
  try {
    const body = await fetchParse('/classes/ZoviaAppVersions', {
      where: JSON.stringify({ appName: appId }),
      limit: '1',
    });
    return body.results?.[0] || null;
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const { request, params } = context;
  const { token } = params;
  const url = new URL(request.url);
  const explicitAppId = url.searchParams.get('app');

  try {
    const spaceBody = await fetchParse('/classes/ZUserGroup', {
      where: JSON.stringify({ inviteToken: token }),
      limit: '1',
    });

    const space = spaceBody.results?.[0];
    if (!space) {
      return errorPage(
        404,
        'Invalid Invite',
        'This invite link is invalid or has expired.',
      );
    }

    const detectedAppId = detectAppId({
      explicitAppId,
      spaceMetadata: space,
      userAgent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer'),
      defaultAppId: 'zistil',
    });

    const platform = getAppConfigForSpace(detectedAppId, space.objectId);
    const appRow = await lookupAppVersion(detectedAppId);

    // DB wins for display + branding + store URLs; code owns platform wiring.
    const appConfig = {
      scheme: platform.scheme,
      androidPackage: platform.androidPackage,
      iosUrl: appRow?.storeUrliOS || '',
      androidUrl: appRow?.storeUrlAndroid || '',
      primaryColor: appRow?.primaryColor || '#3498DB',
    };

    const appDisplayName = appRow?.appDisplayName || detectedAppId;

    return htmlResponse(
      renderJoinSpace(
        {
          spaceName: space.name,
          spaceDescription: space.description || null,
          memberCount: space.memberCount || 0,
          ownerName: space.ownerName || 'Space Admin',
          inviteToken: token,
          spaceType: space.type || 'private',
          appId: detectedAppId,
          appDisplayName,
          appConfig,
        },
        escapeHtml,
      ),
    );
  } catch (err) {
    return errorPage(
      500,
      'Something went wrong',
      "We couldn't load this invite. Please try again later.",
    );
  }
}
