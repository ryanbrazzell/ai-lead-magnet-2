/**
 * Close CRM Client
 *
 * Shared helper for Close CRM API operations.
 * Centralizes auth, field IDs, retry logic, and common operations.
 */

const CLOSE_API_BASE = 'https://api.close.com/api/v1';
const RETRY_DELAY_MS = 500;
const MAX_ATTEMPTS = 3;

const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const STATUS_CONTACTED_VIA_IMESSAGE = 'stat_15lY7bOIOUruTl5a5JwSfpxg9R6Jisp0RKMDd4G2XfQ';

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
  // UTM attribution fields — populated from the landing URL so Close can
  // filter leads by campaign source (Meta ads, Klaviyo emails, etc.)
  utmSource: 'cf_ciNxSPV9fRw7e5h10jy1L4JbL2w3XnARYIoCCWuZW6U',
  utmMedium: 'cf_e1gOI0eSIKu2QZma9j5SaDDEXRRroaEvkOKHGp9KZtB',
  utmCampaign: 'cf_VekhjQNgpgrm6VOy4H3nwZNsUoaUrYm17pG97USZBYi',
  utmContent: 'cf_vzRNBtrBGdCwkjZaWDD5Wx1BlcInSydp3CNZEvZnUSv',
  utmTerm: 'cf_sF2NSTraPl94cEGUZ2hixGaQO48PLWm9e4DucnX2JKC',
  // A/B test: which /report variation a lead was assigned (control | video).
  // Created via scripts/create-close-variation-field.ts at go-live (2026-05-31).
  leadMagnetVariation: 'cf_0uRjoxlSQnlXmLBlAH9dgpUTRsIM3bOqDNHPv78KEjr',
} as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getAuthHeader(): string | null {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines whether a fetch error or HTTP status is transient and worth retrying.
 */
function isTransient(error: unknown): boolean {
  // Network-level failures (DNS, connection reset, etc.)
  if (error instanceof TypeError) return true;

  // Custom wrapper we throw below when the HTTP status is retryable
  if (error instanceof TransientHttpError) return true;

  return false;
}

class TransientHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TransientHttpError';
    this.status = status;
  }
}

/**
 * Generic retry wrapper for async operations.
 *
 * Retries up to 2 times (3 total attempts) on transient failures:
 * network errors, 429, 500, 502, 503, 504.
 * Uses a fixed 500 ms delay between retries.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isTransient(err) || attempt === MAX_ATTEMPTS) {
        throw err;
      }

      console.error(
        `[Close:${label}] Attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${RETRY_DELAY_MS}ms...`,
        err instanceof Error ? err.message : err
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Wraps fetch so that transient HTTP status codes (429, 5xx) throw a
 * retryable error instead of returning a non-ok response silently.
 */
async function closeFetch(
  url: string,
  init: RequestInit
): Promise<Response> {
  const response = await fetch(url, init);

  if (!response.ok && TRANSIENT_STATUS_CODES.has(response.status)) {
    const body = await response.text().catch(() => '(no body)');
    throw new TransientHttpError(
      response.status,
      `HTTP ${response.status}: ${body.slice(0, 200)}`
    );
  }

  return response;
}

// ---------------------------------------------------------------------------
// Existing exports — now with retry and logging
// ---------------------------------------------------------------------------

/**
 * Search for an existing lead by email address.
 * Returns the first matching lead ID, or null if none found.
 */
export async function findLeadByEmail(email: string): Promise<string | null> {
  const auth = getAuthHeader();
  if (!auth) {
    console.error('[Close:findLeadByEmail] CLOSE_API_KEY is not set');
    return null;
  }

  try {
    const response = await withRetry('findLeadByEmail', () =>
      closeFetch(
        `${CLOSE_API_BASE}/lead/?query=email:${encodeURIComponent(email)}&_fields=id&_limit=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth,
          },
        }
      )
    );

    if (!response.ok) {
      console.error('[Close:findLeadByEmail] Non-ok response', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.id || null;
  } catch (err) {
    console.error('[Close:findLeadByEmail] Failed after retries', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Add a note to a Close CRM lead. Used for audit trail — notes are
 * visible in the lead's activity feed and persist forever.
 */
export async function addLeadNote(leadId: string, noteHtml: string): Promise<boolean> {
  const auth = getAuthHeader();
  if (!auth || !leadId) {
    console.error('[Close:addLeadNote] Missing auth or leadId', { hasAuth: !!auth, leadId });
    return false;
  }

  // Close requires note_html to be a single <body>...</body> document;
  // bare paragraph HTML gets a 400 ("HTML rich text fields in Close are
  // expected to start with a <body> tag and end with </body>").
  const wrappedHtml = noteHtml.trimStart().startsWith('<body')
    ? noteHtml
    : `<body>${noteHtml}</body>`;

  try {
    const response = await withRetry('addLeadNote', () =>
      closeFetch(`${CLOSE_API_BASE}/activity/note/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        body: JSON.stringify({
          lead_id: leadId,
          note_html: wrappedHtml,
        }),
      })
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '(no body)');
      console.error('[Close:addLeadNote] Non-ok response', response.status, errorBody.slice(0, 300));
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Close:addLeadNote] Failed after retries', err instanceof Error ? err.message : err);
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
  if (!auth || !leadId) {
    console.error('[Close:updateLeadFields] Missing auth or leadId', { hasAuth: !!auth, leadId });
    return false;
  }

  try {
    const response = await withRetry('updateLeadFields', () =>
      closeFetch(`${CLOSE_API_BASE}/lead/${leadId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        body: JSON.stringify(fields),
      })
    );

    if (!response.ok) {
      console.error('[Close:updateLeadFields] Non-ok response', response.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Close:updateLeadFields] Failed after retries', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Get a lead's data from Close CRM, including custom fields.
 */
export async function getLead(leadId: string): Promise<Record<string, unknown> | null> {
  const auth = getAuthHeader();
  if (!auth || !leadId) {
    console.error('[Close:getLead] Missing auth or leadId', { hasAuth: !!auth, leadId });
    return null;
  }

  try {
    const response = await withRetry('getLead', () =>
      closeFetch(`${CLOSE_API_BASE}/lead/${leadId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      })
    );

    if (!response.ok) {
      console.error('[Close:getLead] Non-ok response', response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('[Close:getLead] Failed after retries', err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// New exports
// ---------------------------------------------------------------------------

/**
 * Verify that a lead ID actually belongs to the given email address.
 * Used to guard against stale or spoofed leadId values from the browser.
 */
export async function verifyLeadOwnership(leadId: string, email: string): Promise<boolean> {
  if (!leadId || !email) {
    console.error('[Close:verifyLeadOwnership] Missing leadId or email');
    return false;
  }

  try {
    const lead = await getLead(leadId);
    if (!lead) {
      console.error('[Close:verifyLeadOwnership] Lead not found', { leadId });
      return false;
    }

    const contacts = lead.contacts as Array<{
      emails?: Array<{ email: string }>;
    }> | undefined;

    if (!contacts || !Array.isArray(contacts)) {
      console.error('[Close:verifyLeadOwnership] Lead has no contacts', { leadId });
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();

    for (const contact of contacts) {
      if (!contact.emails || !Array.isArray(contact.emails)) continue;
      for (const entry of contact.emails) {
        if (entry.email?.toLowerCase().trim() === normalizedEmail) {
          return true;
        }
      }
    }

    console.error('[Close:verifyLeadOwnership] Email not found on lead', { leadId, email });
    return false;
  } catch (err) {
    console.error('[Close:verifyLeadOwnership] Error verifying ownership', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Resolve a leadId for the given email. If no lead exists and formData is
 * provided, creates one server-side (same logic as the create-lead route).
 *
 * This makes the server self-sufficient — it can recover even if the
 * browser-side lead creation failed or the leadId was lost.
 */
export async function resolveLeadByEmail(
  email: string,
  formData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    revenue?: string;
    painPoints?: string;
    meta_fbc?: string;
    meta_fbp?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }
): Promise<string | null> {
  if (!email) {
    console.error('[Close:resolveLeadByEmail] No email provided');
    return null;
  }

  // Step 1: Try to find the existing lead
  const existingId = await findLeadByEmail(email);
  if (existingId) {
    return existingId;
  }

  // Step 2: If no formData, we cannot create — give up
  if (!formData) {
    console.error('[Close:resolveLeadByEmail] Lead not found and no formData to create one', { email });
    return null;
  }

  // Step 3: Create the lead server-side
  const auth = getAuthHeader();
  if (!auth) {
    console.error('[Close:resolveLeadByEmail] CLOSE_API_KEY is not set, cannot create lead');
    return null;
  }

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || email;

  const leadPayload: Record<string, unknown> = {
    name: fullName,
    status_id: STATUS_CONTACTED_VIA_IMESSAGE,
    [`custom.${CLOSE_FIELDS.source}`]: 'Lead Magnet',
  };

  if (formData.meta_fbc) {
    leadPayload[`custom.${CLOSE_FIELDS.metaFbc}`] = formData.meta_fbc;
  }
  if (formData.meta_fbp) {
    leadPayload[`custom.${CLOSE_FIELDS.metaFbp}`] = formData.meta_fbp;
  }
  if (formData.utm_source) {
    leadPayload[`custom.${CLOSE_FIELDS.utmSource}`] = formData.utm_source;
  }
  if (formData.utm_medium) {
    leadPayload[`custom.${CLOSE_FIELDS.utmMedium}`] = formData.utm_medium;
  }
  if (formData.utm_campaign) {
    leadPayload[`custom.${CLOSE_FIELDS.utmCampaign}`] = formData.utm_campaign;
  }
  if (formData.utm_content) {
    leadPayload[`custom.${CLOSE_FIELDS.utmContent}`] = formData.utm_content;
  }
  if (formData.utm_term) {
    leadPayload[`custom.${CLOSE_FIELDS.utmTerm}`] = formData.utm_term;
  }

  try {
    // Create the lead
    const createResponse = await withRetry('resolveLeadByEmail:create', () =>
      closeFetch(`${CLOSE_API_BASE}/lead/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        body: JSON.stringify(leadPayload),
      })
    );

    if (!createResponse.ok) {
      const errText = await createResponse.text().catch(() => '(no body)');
      console.error('[Close:resolveLeadByEmail] Failed to create lead', createResponse.status, errText);
      return null;
    }

    const leadData = await createResponse.json();
    const leadId = leadData.id as string | undefined;

    if (!leadId) {
      console.error('[Close:resolveLeadByEmail] Create response missing id', leadData);
      return null;
    }

    // Add contact with email to the new lead
    try {
      const contactPayload: Record<string, unknown> = {
        contacts: [
          {
            name: fullName,
            emails: [{ email, type: 'office' }],
          },
        ],
      };

      const updateResponse = await withRetry('resolveLeadByEmail:addContact', () =>
        closeFetch(`${CLOSE_API_BASE}/lead/${leadId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth,
          },
          body: JSON.stringify(contactPayload),
        })
      );

      if (!updateResponse.ok) {
        const errText = await updateResponse.text().catch(() => '(no body)');
        console.error('[Close:resolveLeadByEmail] Failed to add contact to lead', updateResponse.status, errText);
        // Lead was created — return it even if the contact update failed
      }
    } catch (contactErr) {
      console.error(
        '[Close:resolveLeadByEmail] Error adding contact to lead',
        contactErr instanceof Error ? contactErr.message : contactErr
      );
      // Lead was created — return it even if the contact update failed
    }

    return leadId;
  } catch (err) {
    console.error('[Close:resolveLeadByEmail] Failed to create lead after retries', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Durable note writer. Same as addLeadNote but uses retry and logs
 * failures with full context. Use this for critical audit-trail notes
 * that MUST be persisted.
 */
export async function addDurableNote(leadId: string, noteHtml: string): Promise<boolean> {
  if (!leadId) {
    console.error('[Close:addDurableNote] Missing leadId');
    return false;
  }

  const success = await addLeadNote(leadId, noteHtml);

  if (!success) {
    console.error('[Close:addDurableNote] FAILED to write critical note', {
      leadId,
      noteLength: noteHtml.length,
      notePreview: noteHtml.slice(0, 200),
    });
  }

  return success;
}
