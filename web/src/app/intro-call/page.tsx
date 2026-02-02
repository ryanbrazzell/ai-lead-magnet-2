/**
 * Intro Call Page - Triage Call Booking Confirmation
 * Displays after someone books a 15-min intro/triage call
 * No Meta Pixel events fire on this page
 */

import { Suspense } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { IntroCallContent } from '@/components/booking-confirmed/intro-call-content';

export const metadata = {
  title: 'Your Intro Call is Booked! | Assistant Launch',
  description: 'Your intro call has been confirmed. Check your email for the calendar invite.',
};

export default function IntroCallPage() {
  return (
    <PageLayout logo="/assistant-launch-logo.png" logoHref="https://www.assistantlaunch.com">
      <Suspense fallback={<LoadingState />}>
        <IntroCallContent />
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
