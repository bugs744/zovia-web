// Cloudflare Pages Function: renders the invite landing page.
// Route: GET /join/:token
//
// Replaces the Express app.get('/join/:token', ...) handler. Uses native
// fetch (no axios) and precompiled EJS render functions (no runtime template
// engine — see scripts/build-templates.js).

import { renderJoinSpace, renderError } from '../_templates.js';
import { getAppConfigForSpace, detectAppId } from '../../config/app-configs.js';

const PARSE_APP_ID = 'PT5etrzSWIMulTzgbT7jmL7nkt6sa4tdeXgkHJQZ';
const PARSE_REST_KEY = '1NZ4ZGOHphuZxRiC1h48XblSv9I7X7VgWhiky0lO';
const PARSE_SERVER_URL = 'https://parseapi.back4app.com';

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

export async function onRequestGet(context) {
  const { request, params } = context;
  const { token } = params;
  const url = new URL(request.url);
  const explicitAppId = url.searchParams.get('app');

  try {
    const parseUrl = new URL(`${PARSE_SERVER_URL}/classes/ZUserGroup`);
    parseUrl.searchParams.set('where', JSON.stringify({ inviteToken: token }));
    parseUrl.searchParams.set('limit', '1');

    const parseRes = await fetch(parseUrl.toString(), {
      headers: {
        'X-Parse-Application-Id': PARSE_APP_ID,
        'X-Parse-REST-API-Key': PARSE_REST_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!parseRes.ok) {
      return errorPage(
        500,
        'Something went wrong',
        "We couldn't load this invite. Please try again later.",
      );
    }

    const body = await parseRes.json();
    const results = body.results;
    if (!results || results.length === 0) {
      return errorPage(
        404,
        'Invalid Invite',
        'This invite link is invalid or has expired.',
      );
    }

    const space = results[0];

    const detectedAppId = detectAppId({
      explicitAppId,
      spaceMetadata: space,
      userAgent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer'),
      defaultAppId: 'zistil',
    });

    const appConfig = getAppConfigForSpace(detectedAppId, space.objectId);

    const data = {
      spaceName: space.name,
      spaceDescription: space.description || null,
      memberCount: space.memberCount || 0,
      ownerName: space.ownerName || 'Space Admin',
      inviteToken: token,
      spaceType: space.type || 'private',
      appId: appConfig.id,
      appDisplayName: appConfig.displayName,
      appConfig: {
        scheme: appConfig.scheme,
        iosUrl: appConfig.iosUrl,
        androidUrl: appConfig.androidUrl,
        androidPackage: appConfig.androidPackage,
      },
    };

    return htmlResponse(renderJoinSpace(data, escapeHtml));
  } catch (err) {
    return errorPage(
      500,
      'Something went wrong',
      "We couldn't load this invite. Please try again later.",
    );
  }
}
