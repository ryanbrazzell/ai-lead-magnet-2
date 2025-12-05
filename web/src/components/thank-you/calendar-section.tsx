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
  if (phone) params.set('iclosedPhone', phone);

  const iClosedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  return (
    <section className="py-12 border-t border-gray-200">
      <div className="text-center mb-8">
        <p className="text-xl text-gray-600 mb-2">
          While you&apos;re waiting for your Roadmap...
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Want to <span className="text-primary">Learn How To Scale</span> Your Business with an EA?
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Note: This call is <strong>NOT</strong> required to receive your EA Roadmap. 
          Only schedule if you&apos;d like to see if you&apos;re a fit for our EA implementation workshop.
        </p>
      </div>

      {/* iClosed Widget Container */}
      <div className="max-w-4xl mx-auto px-4 overflow-hidden">
        <iframe
          src={iClosedUrl}
          style={{ 
            width: '100%', 
            height: '700px', 
            border: 'none', 
            borderRadius: '8px',
            display: 'block'
          }}
          title="Schedule a call - Executive Assistant Discovery"
          allow="payment"
        />
      </div>
    </section>
  );
}
