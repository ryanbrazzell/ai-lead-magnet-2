/**
 * /book-call route
 * Standalone booking page for links from the emailed PDF report.
 * Accepts the same URL params (firstName, lastName, email, phone, etc.)
 * and pre-fills the iClosed booking widget identically to the report page CTA.
 */

import { Suspense } from 'react';
import Script from 'next/script';
import { BookCallContent } from '@/components/book-call/book-call-content';

export const metadata = {
  title: 'Book Your EA Delegation Roadmap Call | Assistant Launch',
};

export default function BookCallPage() {
  return (
    <>
      <Script id="meta-pixel-view-calendar-email" strategy="afterInteractive">
        {`if (!sessionStorage.getItem('calendar_page_view_fired_email')) {
          fbq('trackCustom', 'ViewCalendar');
          sessionStorage.setItem('calendar_page_view_fired_email', 'true');
        }`}
      </Script>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f1f5f9' }} />}>
        <BookCallContent />
      </Suspense>
    </>
  );
}
