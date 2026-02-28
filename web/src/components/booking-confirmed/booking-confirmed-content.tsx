/**
 * BookingConfirmedContent Component
 * Displays after someone books a strategy call through iClosed
 * Polished design matching the report page aesthetic
 */

"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

export function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');

  const firstName = searchParams.get('first_name') || searchParams.get('firstName') || '';
  const email = searchParams.get('email') || '';

  // Retrieve stored values from localStorage (stored by cta-section before iClosed redirect)
  useEffect(() => {
    const storedPhone = localStorage.getItem('assistantlaunch_phone');
    if (storedPhone) {
      setPhone(storedPhone);
    }
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem('assistantlaunch_email') || '';
    const storedLeadId = localStorage.getItem('assistantlaunch_leadId') || '';
    const leadEmail = email || storedEmail;

    // Update Close CRM with call booked status
    const updateCloseCRM = async () => {
      try {
        if (storedLeadId || leadEmail) {
          await fetch('/api/close/mark-call-booked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: storedLeadId,
              email: leadEmail,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to update Close CRM:', err);
      }
    };

    updateCloseCRM();

    // Clean up localStorage (including Meta tracking values)
    localStorage.removeItem('assistantlaunch_leadId');
    localStorage.removeItem('assistantlaunch_email');
    localStorage.removeItem('assistantlaunch_phone');
    localStorage.removeItem('assistantlaunch_fbc');
    localStorage.removeItem('assistantlaunch_fbp');
  }, [email]);

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

      {/* Warning banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          padding: '14px 20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: 'white',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Your call is NOT confirmed yet!
        </p>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '40px 20px 60px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(26px, 6vw, 32px)',
              color: '#0f172a',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            {firstName ? `${firstName}, ` : ''}One More Step
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              fontSize: '16px',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            Accept the calendar invite or your spot may be given away.
          </p>
        </div>

        {/* Demo GIF */}
        <div
          style={{
            marginBottom: '32px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#f59e0b',
                letterSpacing: '0.02em',
              }}
            >
              HOW TO CONFIRM
            </span>
          </div>
          <img
            src="/check-email-demo.gif"
            alt="How to accept your calendar invite"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* 3 Steps Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '28px 24px',
            marginBottom: '32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '20px',
            }}
          >
            Confirm in 3 Steps:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '15px', color: '#f59e0b', fontWeight: 700 }}>1</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13L2 4"/></svg>
                  Check your inbox
                </p>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '13px', color: '#64748b' }}>
                  {email ? <>Look in {email} — check spam too</> : <>Check your email — look in spam too</>}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '15px', color: '#f59e0b', fontWeight: 700 }}>2</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Find the calendar invite
                </p>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '13px', color: '#64748b' }}>
                  From Assistant Launch or Google Calendar
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Click &ldquo;Accept&rdquo; or &ldquo;Yes&rdquo;
                </p>
                <p style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif', fontSize: '13px', color: '#64748b' }}>
                  This confirms your spot
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '14px',
            }}
          >
            Having trouble? Reach out:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="https://instagram.com/ryanbrazzell"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                background: 'linear-gradient(135deg, #E1306C 0%, #833AB4 100%)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              DM Ryan on Instagram
            </a>
            <a
              href="sms:+14424163020"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                textDecoration: 'none',
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Text (442) 416-3020
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '16px',
              color: '#f59e0b',
              fontWeight: 600,
            }}
          >
            Assistant Launch
          </span>
        </div>
      </div>

      {/* Hidden iClosed widget */}
      <div style={{ display: 'none' }}>
        <div className="call-details-widget" data-url="https://app.iclosed.io/embed" style={{ width: '100%', height: '340px' }} />
        <Script src="https://app.iclosed.io/assets/widget.js" strategy="lazyOnload" />
      </div>
    </div>
  );
}
