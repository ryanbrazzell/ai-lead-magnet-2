/**
 * Report Page (formerly Thank You Page)
 * Displays after form submission with:
 * - Confirmation banner
 * - Video section with stage result
 * - Timer countdown CTA
 * - Calendar scheduling option
 * - AI-generated report display
 */

import { Suspense } from 'react';
import { ThankYouContent } from '@/components/thank-you/thank-you-content';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata = {
  title: 'Your EA Roadmap is Ready | Time Freedom Report',
  description: 'Watch this important video while your personalized EA Roadmap is being prepared.',
};

export default function ReportPage() {
  return (
    <PageLayout logo="/assistant-launch-logo.png" logoHref="https://www.assistantlaunch.com">
      <Suspense fallback={<ReportLoading />}>
        <ThankYouContent />
      </Suspense>
    </PageLayout>
  );
}

function ReportLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading your report...</p>
      </div>
    </div>
  );
}
