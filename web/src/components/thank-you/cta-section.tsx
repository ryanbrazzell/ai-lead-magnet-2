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
  painPoints?: string;
  leadId?: string;
  meta_fbc?: string;
  meta_fbp?: string;
  revenue?: string;
}

export function CTASection({
  firstName = '',
  lastName = '',
  email = '',
  phone = '',
  painPoints = '',
  leadId = '',
  meta_fbc = '',
  meta_fbp = '',
  revenue = '',
}: CTASectionProps) {
  // Prevent iClosed widget from auto-scrolling the page.
  // The widget can use scrollIntoView, window.scrollTo, window.scroll, or element.focus()
  // to hijack scroll position. We patch all of them during initialization.
  // User scrolling (wheel, touch, keyboard) is unaffected - those don't call these APIs.
  // The CTA "Book Your Time Audit" button uses scrollIntoView (not scrollTo), so we
  // allow scrollIntoView for elements OUTSIDE the widget container.
  React.useEffect(() => {
    const origScrollIntoView = Element.prototype.scrollIntoView;
    const origScrollTo = window.scrollTo;
    const origScroll = window.scroll;
    const origFocus = HTMLElement.prototype.focus;

    // Block scrollIntoView only for elements inside the widget
    Element.prototype.scrollIntoView = function (...args: Parameters<typeof origScrollIntoView>) {
      const widgetContainer = document.getElementById('calendar-section');
      if (widgetContainer && widgetContainer.contains(this)) {
        return; // Block widget auto-scroll
      }
      return origScrollIntoView.apply(this, args);
    };

    // Block all programmatic window.scrollTo / window.scroll during init
    window.scrollTo = function () { /* blocked during widget init */ } as typeof window.scrollTo;
    window.scroll = function () { /* blocked during widget init */ } as typeof window.scroll;

    // Force preventScroll on focus() for elements inside the widget
    HTMLElement.prototype.focus = function (options?: FocusOptions) {
      const widgetContainer = document.getElementById('calendar-section');
      if (widgetContainer && widgetContainer.contains(this)) {
        return origFocus.call(this, { ...options, preventScroll: true });
      }
      return origFocus.call(this, options);
    };

    const timeoutId = setTimeout(() => {
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
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

  // No-op callback - scroll prevention is handled by the useEffect above
  const handleScriptLoad = React.useCallback(() => {
    console.log('[iClosed] Widget script loaded');
  }, []);

  // Build iClosed URL with pre-filled data
  // Use triage calendar for <$500k revenue, discovery calendar for everyone else
  const isTriageCall = revenue === 'Under $500k';
  const baseUrl = isTriageCall
    ? 'https://app.iclosed.io/e/assistantlaunch/intro-call'
    : 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
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

  // Pass pain points (challenges) to iClosed custom field
  if (painPoints) params.set('pain', painPoints);

  // Pass Meta tracking values as custom hidden fields for CRM attribution
  if (meta_fbc) params.set('fbc', meta_fbc);
  if (meta_fbp) params.set('fbp', meta_fbp);

  // Build URL and replace + with %20 for spaces (iClosed expects %20, not +)
  const queryString = params.toString().replace(/\+/g, '%20');
  const iClosedUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  // Debug logging (sanitized - no PII)
  console.log('[iClosed] Widget configured:', { isTriageCall, hasName: !!fullName, hasEmail: !!email, hasPhone: !!phone });

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
          Ready to focus <span style={{ textDecoration: 'underline' }}>only</span>
          <br />
          your zone of <span style={{ textDecoration: 'underline' }}>genius</span>?
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
          In under 30 minutes, we&apos;re going to show you how the top-performing founders and executives are operating differently.
        </p>

        {/* What We'll Cover */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 24px',
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
              textAlign: 'center',
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
              padding: 0,
              listStyle: 'none',
              lineHeight: 1.8,
            }}
          >
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '3px',
                }}
              >
                &#10003;
              </span>
              <span>Your top 5 tasks to delegate immediately</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '3px',
                }}
              >
                &#10003;
              </span>
              <span>Which EA profile matches your business</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '3px',
                }}
              >
                &#10003;
              </span>
              <span>Your 30-day delegation map to get you performing at the highest level</span>
            </li>
          </ul>
        </div>

        {/* CTA text above calendar */}
        <h3
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: 'clamp(20px, 5vw, 24px)',
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          Schedule your Free Time Strategy Call
        </h3>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{ color: '#f59e0b', margin: '0 auto 8px', display: 'block' }}
        >
          <path
            d="M12 4v16m0 0l-6-6m6 6l6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

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
            strategy="afterInteractive"
            onLoad={handleScriptLoad}
          />
        </div>

      </div>
    </section>
  );
}
