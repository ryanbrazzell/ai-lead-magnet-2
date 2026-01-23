/**
 * BookingConfirmedContent Component
 * Displays after someone books a call through iClosed
 * Shows confirmation and next steps
 */

"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { CheckCircle, Mail, Calendar, MessageCircle } from 'lucide-react';
import { VideoTestimonials } from '@/components/social-proof/video-testimonials';

export function BookingConfirmedContent() {
  const searchParams = useSearchParams();

  // Read user data from URL params (passed by iClosed redirect)
  const firstName = searchParams.get('first_name') || searchParams.get('firstName') || '';
  const email = searchParams.get('email') || '';

  // Fire Meta Pixel Schedule event and update Close CRM on page load
  useEffect(() => {
    // Fire Meta Pixel Schedule event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Schedule', {
        content_name: 'EA Discovery Call',
        content_category: 'Call Booking'
      });
    }

    // Update Close CRM with call booked status
    const updateCloseCRM = async () => {
      try {
        // Try to get leadId from localStorage (set on report page)
        const storedLeadId = localStorage.getItem('assistantlaunch_leadId');
        const storedEmail = localStorage.getItem('assistantlaunch_email');

        // Use email from URL params or localStorage
        const leadEmail = email || storedEmail;

        if (storedLeadId || leadEmail) {
          await fetch('/api/close/mark-call-booked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: storedLeadId,
              email: leadEmail,
            }),
          });
          console.log('Close CRM updated: call booked');

          // Clear localStorage after successful update
          localStorage.removeItem('assistantlaunch_leadId');
          localStorage.removeItem('assistantlaunch_email');
        }
      } catch (err) {
        console.error('Failed to update Close CRM:', err);
        // Non-blocking - don't affect user experience
      }
    };

    updateCloseCRM();
  }, [email]);

  return (
    <div className="min-h-screen bg-white">
      {/* Success Banner */}
      <div className="bg-blue-600 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <span className="text-lg md:text-xl font-semibold">
            Your Call is Booked!
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {firstName ? `${firstName}, You're All Set!` : "You're All Set!"}
          </h1>
          <p className="text-lg text-gray-600">
            We&apos;re excited to speak with you. Here&apos;s what happens next:
          </p>
        </div>

        {/* iClosed Call Details Widget */}
        <div className="mb-12">
          <div
            className="call-details-widget rounded-xl overflow-hidden border border-gray-200"
            data-url="https://app.iclosed.io/embed"
            style={{ width: '100%', height: '340px' }}
          />
          <Script
            src="https://app.iclosed.io/assets/widget.js"
            strategy="lazyOnload"
          />
        </div>

        {/* Next Steps */}
        <div className="space-y-6 mb-12">
          {/* Step 1 */}
          <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Step 1: Check Your Email
              </h3>
              <p className="text-gray-600">
                {email
                  ? <>We&apos;ll send a calendar invite to <strong>{email}</strong>. Check your inbox (and spam folder, just in case).</>
                  : <>You&apos;ll receive a calendar invite shortly. Make sure to check your inbox (and spam folder, just in case).</>
                }
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Step 2: Confirm the Invite
              </h3>
              <p className="text-gray-600">
                Accept the calendar invite so it shows up on your calendar. This ensures you won&apos;t miss our call.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Step 3: Show Up Ready
              </h3>
              <p className="text-gray-600">
                Come prepared to discuss your business and how an Executive Assistant can help you reclaim your time.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">
              Please Confirm Your Call
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            We&apos;ll reach out to make sure your call is confirmed. If you don&apos;t see the confirmation on your end, text our cell below.
            Your call will be cancelled on the day of the event if it isn&apos;t confirmed.
          </p>
          <a
            href="sms:+16199524992"
            className="inline-flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            +1 (619) 952-4992
          </a>
        </div>
      </div>

      {/* Video Testimonials Section */}
      <VideoTestimonials />
    </div>
  );
}
