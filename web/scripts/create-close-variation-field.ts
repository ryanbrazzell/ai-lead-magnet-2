/**
 * One-time setup script: creates the "Lead Magnet Variation" custom field
 * on Close CRM leads. Run once, then paste the printed ID into
 * src/lib/close/client.ts -> CLOSE_FIELDS.leadMagnetVariation.
 *
 * Usage (from web/):  npx tsx scripts/create-close-variation-field.ts
 * Requires CLOSE_API_KEY in the environment (.env.local is loaded by tsx).
 */

import 'dotenv/config';

async function main() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    console.error('CLOSE_API_KEY is not set. Add it to web/.env.local and retry.');
    process.exit(1);
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

  // First, check whether the field already exists, so re-running is safe.
  const listResp = await fetch('https://api.close.com/api/v1/custom_field/lead/?_limit=200', {
    headers: { 'Content-Type': 'application/json', Authorization: auth },
  });
  if (listResp.ok) {
    const list = await listResp.json();
    const existing = (list.data ?? []).find(
      (f: { id: string; name: string }) => f.name === 'Lead Magnet Variation'
    );
    if (existing) {
      console.log(`Field already exists. ID: ${existing.id}`);
      return;
    }
  }

  const resp = await fetch('https://api.close.com/api/v1/custom_field/lead/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      name: 'Lead Magnet Variation',
      type: 'choices',
      accepts_multiple_values: false,
      choices: ['control', 'video'],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Failed to create field: HTTP ${resp.status}\n${text}`);
    process.exit(1);
  }

  const field = await resp.json();
  console.log(`Created custom field "Lead Magnet Variation".`);
  console.log(`ID: ${field.id}`);
  console.log(`Next: paste this ID into src/lib/close/client.ts -> CLOSE_FIELDS.leadMagnetVariation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
