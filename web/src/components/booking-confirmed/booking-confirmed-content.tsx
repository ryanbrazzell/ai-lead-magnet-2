/**
 * BookingConfirmedContent Component
 * Displays after someone books a call through iClosed
 * Simple, clean thank you page - mobile first
 */

"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { AlertTriangle, Mail, Calendar, CheckCircle, Instagram, MessageCircle, Play } from 'lucide-react';

export function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const [showVideo, setShowVideo] = useState(false);
  const [phone, setPhone] = useState('');

  const firstName = searchParams.get('first_name') || searchParams.get('firstName') || '';
  const email = searchParams.get('email') || '';

  // Retrieve phone from localStorage (stored before iClosed redirect)
  useEffect(() => {
    const storedPhone = localStorage.getItem('assistantlaunch_phone');
    if (storedPhone) {
      setPhone(storedPhone);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Schedule', {
        content_name: 'EA Discovery Call',
        content_category: 'Call Booking'
      });
    }

    const updateCloseCRM = async () => {
      try {
        const storedLeadId = localStorage.getItem('assistantlaunch_leadId');
        const storedEmail = localStorage.getItem('assistantlaunch_email');
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
          localStorage.removeItem('assistantlaunch_leadId');
          localStorage.removeItem('assistantlaunch_email');
        }
      } catch (err) {
        console.error('Failed to update Close CRM:', err);
      }
    };

    updateCloseCRM();
  }, [email]);

  return (
    <div className="min-h-screen bg-white">
      {/* Warning Banner - full width */}
      <div className="w-full bg-red-600 py-3 px-4">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-300" />
          <span className="text-sm font-semibold text-white">
            Your call is NOT confirmed yet!
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {firstName ? `${firstName}, ` : ''}One More Step
          </h1>
          <p className="text-gray-600 text-sm">
            Accept the calendar invite or your spot may be given away.
          </p>
        </div>

        {/* Video */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Play className="w-4 h-4 text-amber-500" />
            How to Confirm (30 sec)
          </p>
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-900"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setShowVideo(true)}
          >
            {!showVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center mb-2">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <p className="text-gray-400 text-xs">Tap to watch</p>
              </div>
            ) : (
              <iframe
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* 3 Steps */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-900 mb-4">Confirm in 3 Steps:</p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4 text-amber-500" /> Check your inbox
                </p>
                <p className="text-xs text-gray-500">
                  {email ? <>Look in {email} — check spam too</> : <>Check your email — look in spam too</>}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-amber-500" /> Find the calendar invite
                </p>
                <p className="text-xs text-gray-500">From Assistant Launch or Google Calendar</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Click "Accept" or "Yes"
                </p>
                <p className="text-xs text-gray-500">This confirms your spot</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mb-8">
          <p className="text-sm text-gray-700 mb-3 text-center">Having trouble? Reach out:</p>
          <div className="flex flex-col gap-2">
            <a
              href="https://instagram.com/ryanbrazzell"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #E1306C 0%, #833AB4 100%)' }}
            >
              <Instagram className="w-4 h-4" /> DM Ryan on Instagram
            </a>
            <a
              href="sms:+16199524992"
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-gray-900 bg-gray-100"
            >
              <MessageCircle className="w-4 h-4" /> Text (619) 952-4992
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-amber-500 font-semibold">
          Assistant Launch 🚀
        </div>
      </div>

      {/* Hidden iClosed widget */}
      <div className="hidden">
        <div className="call-details-widget" data-url="https://app.iclosed.io/embed" style={{ width: '100%', height: '340px' }} />
        <Script src="https://app.iclosed.io/assets/widget.js" strategy="lazyOnload" />
      </div>
    </div>
  );
}
