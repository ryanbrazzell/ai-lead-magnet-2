/**
 * /book-call route
 * Standalone booking page for links from the emailed PDF report.
 * Accepts the same URL params (firstName, lastName, email, phone, etc.)
 * and pre-fills the iClosed booking widget identically to the report page CTA.
 */

import { Suspense } from 'react';
import { BookCallContent } from '@/components/book-call/book-call-content';

export const metadata = {
  title: 'Book Your EA Delegation Roadmap Call | Assistant Launch',
};

export default function BookCallPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />}>
      <BookCallContent />
    </Suspense>
  );
}
