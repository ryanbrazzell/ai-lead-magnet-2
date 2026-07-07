/**
 * API Route: POST /api/resend-report
 *
 * Re-sends a report email to a lead without regenerating the PDF.
 * Looks up the existing blob URL from Close CRM and re-sends.
 *
 * If no blob URL exists, falls back to full regeneration via /api/generate-report.
 *
 * Request Body:
 *   { leadId: string }           — look up email + blob URL from CRM
 *   { leadId: string, email: string } — override recipient (e.g., fix typo)
 *
 * Intended for internal/admin use to recover from bounces or fix typos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getLead, CLOSE_FIELDS, addLeadNote } from '@/lib/close/client';
import { generateEmailHtml } from '@/lib/email/template';
import { sendSlackAlert } from '@/lib/alerts/critical-alert';

export async function POST(request: NextRequest) {
  let body: { leadId: string; email?: string; apologyIntro?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { leadId, email: overrideEmail, apologyIntro } = body;

  if (!leadId) {
    return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
  }

  // Look up the lead in Close CRM
  const lead = await getLead(leadId);
  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead not found in Close CRM' }, { status: 404 });
  }

  // Extract data from lead
  const blobUrl = lead[`custom.${CLOSE_FIELDS.timeFreedomReportUrl}`] as string | undefined;
  const contacts = lead.contacts as Array<{ emails?: Array<{ email: string }>; name?: string }> | undefined;
  const contact = contacts?.[0];
  const leadEmail = overrideEmail || contact?.emails?.[0]?.email;
  const leadName = (contact?.name || lead.name || '') as string;
  const firstName = leadName.split(' ')[0] || '';

  if (!leadEmail) {
    return NextResponse.json({ success: false, error: 'No email found for this lead' }, { status: 400 });
  }

  if (!blobUrl) {
    return NextResponse.json({
      success: false,
      error: 'No report URL found for this lead. Use /api/generate-report to generate a new report.',
      needsRegeneration: true,
    }, { status: 404 });
  }

  // Download the PDF from Vercel Blob
  let pdfBase64: string | null = null;
  try {
    const pdfResponse = await fetch(blobUrl);
    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.arrayBuffer();
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    }
  } catch (err) {
    console.error('Failed to download PDF from blob:', err);
  }

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const userData = { firstName, lastName: '', email: leadEmail, phone: '' };
  const htmlContent = generateEmailHtml(firstName, userData, blobUrl, apologyIntro);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Ryan at Assistant Launch <ryan@assistantlaunch.com>',
      to: leadEmail,
      subject: `${firstName || 'Hi'}, Your Time Freedom Report is Ready`,
      html: htmlContent,
      attachments: pdfBase64
        ? [
            {
              filename: `EA-Time-Freedom-Report-${firstName || 'User'}.pdf`,
              content: pdfBase64,
            },
          ]
        : undefined,
    });

    if (error) {
      console.error('Resend-report email failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Add audit note to Close CRM
    const target = overrideEmail ? ` (corrected to ${overrideEmail})` : '';
    void addLeadNote(
      leadId,
      `<p><strong>Report Re-sent</strong>${target}</p><p>Message ID: ${data?.id}</p><p>PDF: <a href="${blobUrl}">${blobUrl}</a></p>`
    );

    void sendSlackAlert('Report Re-sent', {
      emoji: ':repeat:',
      error: `Re-sent to ${leadEmail}${target}`,
      endpoint: '/api/resend-report',
      userEmail: leadEmail,
      leadId,
    });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      sentTo: leadEmail,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Resend-report error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
