/**
 * ConfirmationBanner Component
 * Green gradient banner at the top of the video-led /report variation.
 * "Congrats, one step left" framing per the A/B test design.
 */

"use client";

interface ConfirmationBannerProps {
  firstName?: string;
  email?: string;
}

export function ConfirmationBanner({ firstName, email }: ConfirmationBannerProps) {
  const greeting = firstName ? `Congrats ${firstName}, you're one step away.` : "Congrats, you're one step away.";

  return (
    <div
      className="text-center text-white"
      style={{
        fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        padding: '20px 16px',
        fontWeight: 500,
      }}
    >
      <div style={{ marginBottom: '4px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
            fill="currentColor"
          />
        </svg>
        <strong>{greeting}</strong>
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        Watch this 60-second video, then book your call right below.
        {email ? ` Your full report is on its way to ${email}.` : ''}
      </div>
    </div>
  );
}
