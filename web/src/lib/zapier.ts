/**
 * Zapier webhook integration
 * Task Group 2: Webhook utility for Step 1 partial lead capture
 *
 * Preserves exact webhook behavior from original LeadForm.tsx lines 122-143
 * Non-blocking: logs errors to console but doesn't prevent Step 2 navigation
 */

export interface ZapierPayload {
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  source: string;
  step: string;
  timestamp: string;
}

/**
 * Send Step 1 form data to Zapier webhook
 *
 * Non-blocking implementation:
 * - Catches and logs errors to console
 * - Does not throw or prevent user progression
 * - Allows Step 2 navigation even if webhook fails
 *
 * @param payload - Form data to send to Zapier
 */
export async function sendToZapier(payload: ZapierPayload): Promise<void> {
  try {
    await fetch('/api/zapier/simplified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('Step 1 Zapier webhook sent successfully');
  } catch (error) {
    console.error('Failed to send Step 1 Zapier webhook:', error);
    // Don't block user progression if webhook fails
  }
}
