// apps/web/src/lib/oauth/linkedin.ts

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export const LINKEDIN_SCOPES_PERSONAL = 'openid profile email w_member_social r_member_social';
export const LINKEDIN_SCOPES_ORGANIZATION =
  'openid profile email w_member_social r_member_social w_organization_social r_organization_social';

function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl.endsWith('/')) return envUrl.slice(0, -1);
  return envUrl;
}

export function getLinkedInRedirectUri(): string {
  const appUrl = getAppUrl();
  if (appUrl) return `${appUrl}/api/auth/linkedin/callback`;
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;
}

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

export function getLinkedInAuthUrl(companyId: string, postMode: 'profile' | 'page'): string {
  const state = encodeOAuthState({
    companyId,
    platform: 'linkedin',
    postMode,
    ts: Date.now().toString(),
  });
  const scope = postMode === 'page' ? LINKEDIN_SCOPES_ORGANIZATION : LINKEDIN_SCOPES_PERSONAL;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: getLinkedInRedirectUri(),
    state,
    scope,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirect_uri: getLinkedInRedirectUri(),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error_description?: string }).error_description
      || `LinkedIn token exchange failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(LINKEDIN_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch LinkedIn profile (${res.status})`);
  return res.json();
}

// ============================================
// ORGANIZATION/COMPANY PAGE FUNCTIONS
// ============================================

export interface LinkedInOrganization {
  id: string;
  name: string;
  vanityName?: string;
  logoUrl?: string;
}

export async function getLinkedInOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
  try {
    console.log('[LinkedIn OAuth] Fetching organizations...');
    const aclRes = await fetch(
      `${LINKEDIN_API_URL}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (!aclRes.ok) {
      console.log('[LinkedIn OAuth] No organizations found or no permission:', aclRes.status);
      return await getLinkedInOrganizationsAlternative(accessToken);
    }

    const aclData = await aclRes.json() as {
      elements?: Array<{
        organization?: string;
        'organization~'?: {
          id?: number;
          localizedName?: string;
          vanityName?: string;
          'logoV2'?: {
            'original~'?: {
              elements?: Array<{
                identifiers?: Array<{ identifier?: string }>;
              }>;
            };
          };
        };
      }>;
    };

    const organizations: LinkedInOrganization[] = [];
    for (const element of aclData.elements || []) {
      const orgDetails = element['organization~'];
      if (orgDetails) {
        const logoUrl = orgDetails['logoV2']?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier;
        organizations.push({
          id: String(orgDetails.id || element.organization?.split(':').pop() || ''),
          name: orgDetails.localizedName || 'Unknown Organization',
          vanityName: orgDetails.vanityName,
          logoUrl,
        });
      }
    }
    console.log('[LinkedIn OAuth] Found organizations:', organizations.length);
    return organizations;
  } catch (error) {
    console.error('[LinkedIn OAuth] Failed to fetch organizations:', error);
    return [];
  }
}

async function getLinkedInOrganizationsAlternative(accessToken: string): Promise<LinkedInOrganization[]> {
  try {
    const res = await fetch(
      `${LINKEDIN_API_URL}/organizationalEntityAcls?q=roleAssignee&projection=(elements*(organizationalTarget))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (!res.ok) {
      console.log('[LinkedIn OAuth] Alternative org fetch also failed:', res.status);
      return [];
    }

    const data = await res.json() as {
      elements?: Array<{ organizationalTarget?: string }>;
    };

    const orgIds: string[] = [];
    for (const element of data.elements || []) {
      const target = element.organizationalTarget;
      if (target && target.includes('organization')) {
        const id = target.split(':').pop();
        if (id) orgIds.push(id);
      }
    }
    if (orgIds.length === 0) return [];

    const organizations: LinkedInOrganization[] = [];
    for (const orgId of orgIds) {
      try {
        const orgRes = await fetch(
          `${LINKEDIN_API_URL}/organizations/${orgId}?projection=(id,localizedName,vanityName)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );
        if (orgRes.ok) {
          const orgData = await orgRes.json() as {
            id?: number;
            localizedName?: string;
            vanityName?: string;
          };
          organizations.push({
            id: String(orgData.id || orgId),
            name: orgData.localizedName || 'Organization',
            vanityName: orgData.vanityName,
          });
        }
      } catch { /* skip */ }
    }
    return organizations;
  } catch (error) {
    console.error('[LinkedIn OAuth] Alternative org fetch failed:', error);
    return [];
  }
}

export function encodeOrganizations(orgs: LinkedInOrganization[]): string {
  return Buffer.from(JSON.stringify(orgs)).toString('base64url');
}

export function decodeOrganizations(encoded: string): LinkedInOrganization[] {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString());
  } catch {
    return [];
  }
}