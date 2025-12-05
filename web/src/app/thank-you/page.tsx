/**
 * Thank You Page - Booking Confirmation
 * Displays after someone books a call through iClosed
 * Shows next steps and contact information
 */

import { Suspense } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { BookingConfirmedContent } from '@/components/booking-confirmed/booking-confirmed-content';

export const metadata = {
  title: 'Your Call is Booked! | Assistant Launch',
  description: 'Your call has been confirmed. Check your email for the calendar invite.',
};

export default function ThankYouPage() {
  return (
    <PageLayout logo="/assistant-launch-logo.png" logoHref="https://www.assistantlaunch.com">
      <Suspense fallback={<LoadingState />}>
        <BookingConfirmedContent />
      </Suspense>
    </PageLayout>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
