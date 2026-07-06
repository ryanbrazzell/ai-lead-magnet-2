/**
 * CTASection Component
 * "Want help making sense of your report?" section with iClosed calendar
 * Uses iClosed inline widget (same as services page) for proper redirect support
 */

"use client";

import * as React from 'react';
import Script from 'next/script';

interface CTASectionProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  leadId?: string;
  meta_fbc?: string;
  meta_fbp?: string;
}

export function CTASection({
  firstName = '',
  lastName = '',
  email = '',
  phone = '',
  leadId = '',
  meta_fbc = '',
  meta_fbp = '',
}: CTASectionProps) {
  // Store scroll position to prevent iClosed widget from auto-scrolling
  const scrollPositionRef = React.useRef<number>(0);
  const scrollLockActiveRef = React.useRef<boolean>(false);

  // Save scroll position and prevent auto-scroll from widget
  React.useEffect(() => {
    // Save initial scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Also prevent any scroll events from the widget during initial load
    const preventScroll = (e: Event) => {
      if (scrollLockActiveRef.current) {
        e.preventDefault();
        window.scrollTo(0, scrollPositionRef.current);
      }
    };
    
    // Lock scrolling immediately for 3 seconds after mount
    scrollLockActiveRef.current = true;
    window.addEventListener('scroll', preventScroll, { passive: false });
    
    const timeoutId = setTimeout(() => {
      scrollLockActiveRef.current = false;
      window.removeEventListener('scroll', preventScroll);
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', preventScroll);
    };
  }, []);

  // Store leadId, phone, and meta tracking values in localStorage so we can retrieve after iClosed redirect
  React.useEffect(() => {
    if (leadId) {
      localStorage.setItem('assistantlaunch_leadId', leadId);
    }
    if (email) {
      localStorage.setItem('assistantlaunch_email', email);
    }
    if (phone) {
      localStorage.setItem('assistantlaunch_phone', phone);
    }
    if (meta_fbc) {
      localStorage.setItem('assistantlaunch_fbc', meta_fbc);
    }
    if (meta_fbp) {
      localStorage.setItem('assistantlaunch_fbp', meta_fbp);
    }
  }, [leadId, email, phone, meta_fbc, meta_fbp]);

  // Restore scroll position after widget script loads (prevents auto-scroll)
  const handleScriptLoad = React.useCallback(() => {
    // Lock scroll restoration for 2 seconds to catch widget initialization
    scrollLockActiveRef.current = true;
    const savedPosition = scrollPositionRef.current;

    // Immediately restore position
    window.scrollTo(0, savedPosition);

    // Set up interval to keep restoring scroll position for 2 seconds
    // This catches any delayed scroll attempts by the widget
    const intervalId = setInterval(() => {
      if (scrollLockActiveRef.current) {
        window.scrollTo(0, savedPosition);
      }
    }, 50);

    // Release scroll lock after 2 seconds
    setTimeout(() => {
      scrollLockActiveRef.current = false;
      clearInterval(intervalId);
    }, 2000);
  }, []);

  // Build iClosed URL with pre-filled data
  const baseUrl = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  const params = new URLSearchParams();

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (fullName) params.set('iclosedName', fullName);
  if (email) params.set('iclosedEmail', email);

  // Format phone for iClosed - ensure +1 prefix for US numbers
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    let formattedPhone: string;
    if (phoneDigits.length === 10) {
      // 10 digits = US number without country code, add +1
      formattedPhone = `+1${phoneDigits}`;
    } else if (phoneDigits.startsWith('1') && phoneDigits.length === 11) {
      // 11 digits starting with 1 = US number with country code, add +
      formattedPhone = `+${phoneDigits}`;
    } else {
      // Other formats, pass as-is with + if not present
      formattedPhone = phone.startsWith('+') ? phone : `+${phoneDigits}`;
    }
    params.set('iclosedPhone', formattedPhone);
  }

  // Set time format to 12-hour (AM/PM)
  params.set('timeFormat', '12h');

  // Pass Meta tracking values for CAPI attribution via iClosed → Zapier → Meta
  // These are passed as custom hidden fields that iClosed sends to webhooks
  if (meta_fbc) params.set('fbc', meta_fbc);
  if (meta_fbp) params.set('fbp', meta_fbp);

  const iClosedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  // Debug logging
  console.log('[iClosed] Prefill data:', { firstName, lastName, email, phone, meta_fbc, meta_fbp, iClosedUrl });

  return (
    <section
      id="schedule-call-section"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)',
        padding: '48px 0',
        textAlign: 'center',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: 'clamp(22px, 6vw, 28px)',
            marginBottom: '12px',
            color: '#0f172a',
          }}
        >
          Ready to focus <span style={{ textDecoration: 'underline' }}>only</span> on your zone of genius?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            color: '#475569',
            marginBottom: '16px',
            maxWidth: '480px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          In 30 minutes, we&apos;ll show you exactly which tasks to hand off first — and how to do it without the training headache.
        </p>

        {/* What We'll Cover */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            textAlign: 'left',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '12px',
            }}
          >
            On this call, we&apos;ll cover:
          </p>
          <ul
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#475569',
              margin: 0,
              paddingLeft: '20px',
              lineHeight: 1.8,
            }}
          >
            <li>Your top 5 tasks to delegate immediately</li>
            <li>Which EA profile matches your business</li>
            <li>Your 30-day delegation roadmap</li>
          </ul>
        </div>

        {/* Speed Badge */}
        <div
          style={{
            display: 'inline-block',
            background: '#0f172a',
            color: '#f59e0b',
            padding: '8px 16px',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
          }}
        >
          3-7 days to EA Kickoff
        </div>

        {/* iClosed Calendar - Using inline widget (same as services page) */}
        <div
          id="calendar-section"
          style={{
            width: '100%',
            minHeight: '620px',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '12px',
            marginBottom: '8px',
          }}
        >
          {/* iClosed inline widget - runs in page context, supports redirects */}
          <div
            className="iclosed-widget"
            data-url={iClosedUrl}
            title="Schedule a call - Executive Assistant Discovery"
            style={{
              width: '100%',
              height: '620px',
            }}
          />
          <Script
            src="https://app.iclosed.io/assets/widget.js"
            strategy="lazyOnload"
            onLoad={handleScriptLoad}
          />
        </div>

      </div>
    </section>
  );
}

