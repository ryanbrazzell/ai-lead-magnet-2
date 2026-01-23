/**
 * CalendarSection Component
 * Displays a calendar scheduling widget for booking calls
 * Uses iClosed widget embed
 */

"use client";

import * as React from 'react';

interface CalendarSectionProps {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export function CalendarSection({
  firstName,
  lastName = '',
  email = '',
  phone = '',
}: CalendarSectionProps) {
  // Build iClosed URL with pre-filled data using iClosed's parameter format
  // Docs: https://intercom.help/iclosed/en/articles/9830929-pre-populate-form-questions-with-invitee-information
  const baseUrl = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  const params = new URLSearchParams();

  // iClosed uses iclosedName for full name (not separate first/last)
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (fullName) params.set('iclosedName', fullName);
  if (email) params.set('iclosedEmail', email);

  // Format phone for iClosed - strip the +1 prefix if present, keep just digits
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    // If it starts with 1 and is 11 digits, it's a US number with country code
    const formattedPhone = phoneDigits.startsWith('1') && phoneDigits.length === 11
      ? phoneDigits.slice(1) // Remove leading 1
      : phoneDigits;
    params.set('iclosedPhone', formattedPhone);
  }

  // Set time format to 12-hour (AM/PM)
  params.set('timeFormat', '12h');

  const iClosedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  console.log('[iClosed Calendar] Prefill data:', { firstName, lastName, email, phone, iClosedUrl });
  return (
    <section
      id="calendar-section"
      style={{
        background: 'white',
        padding: '60px 0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* iClosed Widget Container */}
        <div
          style={{
            width: '100%',
            minHeight: '600px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <iframe
            src={iClosedUrl}
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              borderRadius: '8px',
            }}
            title="Schedule a call - Executive Assistant Discovery"
            allow="payment"
          />
        </div>
      </div>
    </section>
  );
}
