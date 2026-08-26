// apps/web/src/lib/oauth/facebook.ts

const FB_API_VERSION = 'v21.0';
const FB_AUTH_URL = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;
const FB_TOKEN_URL = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`;
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ============================================
// PERMISSIONS CONFIGURATION
// ============================================

export const FACEBOOK_SCOPES_DEVELOPMENT = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
].join(',');

export const FACEBOOK_SCOPES_MINIMAL = [
  'pages_show_list',
  'public_profile',
].join(',');

export const FACEBOOK_SCOPES_PRODUCTION = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_read_user_content',
].join(',');

const USE_MINIMAL_SCOPES = false;

export const FACEBOOK_SCOPES = USE_MINIMAL_SCOPES
  ? FACEBOOK_SCOPES_MINIMAL
  : FACEBOOK_SCOPES_PRODUCTION;

// ============================================
// URL HELPERS â€“ DYNAMIC, NO HARDCODED FALLBACK
// ============================================

function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl.endsWith('/')) return envUrl.slice(0, -1);
  return envUrl;
}

export function getFacebookRedirectUri(): string {
  const appUrl = getAppUrl();
  if (appUrl) return `${appUrl}/api/auth/facebook/callback`;
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
}

// ============================================
// OAUTH STATE
// ============================================

export function encodeOAuthState(data: Record<string, string>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeOAuthState(state: string): Record<string, string> {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    throw new Error('Invalid OAuth state');
  }
}

// ============================================
// OAUTH FUNCTIONS
// ============================================

/**
 * @param companyId
 * @param postMode â€“ 'profile' | 'page' (ignored for Facebook; always page)
 */
export function getFacebookAuthUrl(companyId: string, postMode: 'profile' | 'page' = 'page'): string {
  const redirectUri = getFacebookRedirectUri();

  const state = encodeOAuthState({
    companyId,
    platform: 'facebook',
    ts: Date.now().toString(),
    redirectUri,
  });

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    redirect_uri: redirectUri,
    state,
    scope: FACEBOOK_SCOPES,
    response_type: 'code',
  });

  const authUrl = `${FB_AUTH_URL}?${params.toString()}`;
  console.log('[Facebook OAuth] Auth URL:', authUrl);
  return authUrl;
}

export async function exchangeFacebookCode(code: string, stateRedirectUri?: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const redirectUri = stateRedirectUri || getFacebookRedirectUri();

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Facebook token exchange failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to get long-lived token (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

// ============================================
// FACEBOOK PAGES
// ============================================

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks?: string[];
}

export async function getFacebookPages(userToken: string): Promise<FacebookPage[]> {
  const params = new URLSearchParams({
    access_token: userToken,
    fields: 'id,name,access_token,category,tasks',
  });

  const res = await fetch(`${FB_GRAPH_URL}/me/accounts?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to fetch Facebook pages (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return (data as { data: FacebookPage[] }).data || [];
}

// ============================================
// USER PROFILE
// ============================================

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export async function getFacebookUserProfile(userToken: string): Promise<FacebookUserProfile> {
  const params = new URLSearchParams({
    access_token: userToken,
    fields: 'id,name,email,picture',
  });

  const res = await fetch(`${FB_GRAPH_URL}/me?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message || 'Failed to fetch user profile'
    );
  }
  return res.json();
}