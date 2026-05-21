/**
 * Record the assigned A/B variation on a Close CRM lead.
 *
 * First-write-wins: if the lead already has a variation, it is left
 * untouched. This keeps a lead's assignment fixed for the life of the
 * test even though Close dedupes leads by email and a person may submit
 * the funnel more than once.
 */

import type { Variation } from '@/lib/ab-test/variation';
import { getLead, updateLeadFields, CLOSE_FIELDS } from './client';

const FIELD_KEY = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;

export async function recordLeadVariation(
  leadId: string,
  variation: Variation
): Promise<boolean> {
  if (!leadId) {
    console.error('[recordLeadVariation] Missing leadId');
    return false;
  }

  const lead = await getLead(leadId);
  if (!lead) {
    console.error('[recordLeadVariation] Lead not found', { leadId });
    return false;
  }

  // First-write-wins: never overwrite an existing assignment.
  if (lead[FIELD_KEY]) {
    return true;
  }

  return updateLeadFields(leadId, { [FIELD_KEY]: variation });
}
