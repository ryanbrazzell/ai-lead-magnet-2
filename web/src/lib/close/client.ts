/**
 * Close CRM Client
 *
 * Shared helper for Close CRM API operations.
 * Centralizes auth, field IDs, and common operations.
 */

/** Close CRM custom field IDs */
export const CLOSE_FIELDS = {
  source: 'cf_gU07dqgKBcSNC5ZUf40ywU2sVzTOKpt25chQa7lqFA3',
  metaFbc: 'cf_UpanwKhodgxgX4iGo9ojwGLnnznVn4QxDInvnQQAtg0',
  metaFbp: 'cf_It6Q5mcWJ3yVJU0FwWhxpIYLXXOowB3n2jX0pzkkCzx',
  clientIp: 'cf_iOVXsJqipBnqCE6nXNCht5mrswcy5tUFtrxxK6KWpuj',
  clientUserAgent: 'cf_MeswVV4QBx6j3UJrs3VOIWnxuO8hAQOrjuKbRFGWYbm',
  painPoints: 'cf_8Y2FFKdfC1RFNPPJrf0KSXmhteiUBKE7mVphDEufevm',
  revenue: 'cf_3ZBZfCabFHWwranwv1nyY1aPU2oLd6TuAcWGlZepQpZ',
  timeFreedomReportUrl: 'cf_qiHCe6NXTEKZQHLU1rxM091VUQGfMTlpMefEx1tSQAI',
} as const;

function getAuthHeader(): string | null {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

/**
 * Search for an existing lead by email address.
 * Returns the first matching lead ID, or null if none found.
 */
export async function findLeadByEmail(email: string): Promise<string | null> {
  const auth = getAuthHeader();
  if (!auth) return null;

  try {
    const response = await fetch(
      `https://api.close.com/api/v1/lead/?query=email:${encodeURIComponent(email)}&_fields=id&_limit=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Add a note to a Close CRM lead. Used for audit trail — notes are
 * visible in the lead's activity feed and persist forever.
 */
export async function addLeadNote(leadId: string, noteHtml: string): Promise<boolean> {
  const auth = getAuthHeader();
  if (!auth || !leadId) return false;

  try {
    const response = await fetch('https://api.close.com/api/v1/activity/note/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        lead_id: leadId,
        note_html: noteHtml,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Update custom fields on a Close CRM lead.
 */
export async function updateLeadFields(
  leadId: string,
  fields: Record<string, unknown>
): Promise<boolean> {
  const auth = getAuthHeader();
  if (!auth || !leadId) return false;

  try {
    const response = await fetch(`https://api.close.com/api/v1/lead/${leadId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(fields),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a lead's data from Close CRM, including custom fields.
 */
export async function getLead(leadId: string): Promise<Record<string, unknown> | null> {
  const auth = getAuthHeader();
  if (!auth || !leadId) return null;

  try {
    const response = await fetch(`https://api.close.com/api/v1/lead/${leadId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
