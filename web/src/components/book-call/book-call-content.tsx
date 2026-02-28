/**
 * BookCallContent Component
 * Standalone booking page for links from emailed PDF reports.
 * Pre-fills iClosed with user data passed via URL params — same approach as cta-section.tsx.
 */

"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

export function BookCallContent() {
  const searchParams = useSearchParams();

  const firstName = searchParams.get('firstName') || searchParams.get('first_name') || '';
  const lastName = searchParams.get('lastName') || searchParams.get('last_name') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const revenue = searchParams.get('revenue') || '';
  const leadId = searchParams.get('leadId') || '';

  // Store leadId, phone, and email in localStorage for retrieval after iClosed redirect
  React.useEffect(() => {
    if (leadId) localStorage.setItem('assistantlaunch_leadId', leadId);
    if (email) localStorage.setItem('assistantlaunch_email', email);
    if (phone) localStorage.setItem('assistantlaunch_phone', phone);
  }, [leadId, email, phone]);

  // Prevent iClosed widget from auto-scrolling (same as cta-section.tsx)
  React.useEffect(() => {
    const origScrollTo = window.scrollTo;
    const origScroll = window.scroll;

    window.scrollTo = function () {} as typeof window.scrollTo;
    window.scroll = function () {} as typeof window.scroll;

    const timeoutId = setTimeout(() => {
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
    };
  }, []);

  // Build iClosed URL with pre-filled data (same logic as cta-section.tsx)
  const isTriageCall = revenue === 'Under $500k';
  const baseUrl = isTriageCall
    ? 'https://app.iclosed.io/e/assistantlaunch/intro-call'
    : 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  const params = new URLSearchParams();

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (fullName) params.set('iclosedName', fullName);
  if (email) params.set('iclosedEmail', email);

  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    let formattedPhone: string;
    if (phoneDigits.length === 10) {
      formattedPhone = `+1${phoneDigits}`;
    } else if (phoneDigits.startsWith('1') && phoneDigits.length === 11) {
      formattedPhone = `+${phoneDigits}`;
    } else {
      formattedPhone = phone.startsWith('+') ? phone : `+${phoneDigits}`;
    }
    params.set('iclosedPhone', formattedPhone);
  }

  params.set('timeFormat', '12h');

  const queryString = params.toString().replace(/\+/g, '%20');
  const iClosedUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Navy header bar */}
      <div
        style={{
          background: '#0f172a',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <a
          href="https://www.assistantlaunch.com"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '24px', color: '#f59e0b' }}>
            Assistant Launch
          </span>
        </a>
      </div>

      {/* Hero section */}
      <section
        style={{
          background: '#0f172a',
          padding: 'clamp(32px, 6vw, 48px) 0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(28px, 5vw, 40px)',
              color: 'white',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            It&apos;s Time to Buy Back Your Time
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '16px',
              color: '#94a3b8',
              marginBottom: '0',
            }}
          >
            Schedule your free time strategy call
          </p>
        </div>
      </section>

      {/* What we'll cover + calendar */}
      <section
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)',
          padding: '40px 0 48px',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          {/* What happens on your call */}
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(20px, 5vw, 26px)',
              color: '#0f172a',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            What Happens on Your Free Time Strategy Call
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              textAlign: 'center',
              marginBottom: '20px',
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            In under 30 minutes, we&apos;ll show you how the top-performing founders and executives are operating differently.
          </p>

          {/* Checkmark bullets */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 24px',
              marginBottom: '28px',
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
              {[
                'Your top 5 tasks to delegate immediately',
                'Which EA profile matches your business',
                'Your 30-day delegation map to get you performing at the highest level',
              ].map((item, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
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
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA text above calendar */}
          <h3
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(20px, 5vw, 24px)',
              color: '#0f172a',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            Book Your FREE Time Strategy Call
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

          {/* iClosed Calendar Widget */}
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
            <div
              className="iclosed-widget"
              data-url={iClosedUrl}
              title="Schedule a call - Executive Assistant Discovery"
              style={{ width: '100%', height: '620px' }}
            />
            <Script
              src="https://app.iclosed.io/assets/widget.js"
              strategy="afterInteractive"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
