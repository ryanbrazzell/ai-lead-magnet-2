/**
 * ConfirmationBanner Component
 * Green gradient banner at top of page
 * Shows email address instead of "your inbox"
 */

"use client";

interface ConfirmationBannerProps {
  email?: string;
}

export function ConfirmationBanner({ email }: ConfirmationBannerProps) {
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
        <strong>Your personalized Time Freedom Report is heading to {email ? email : 'your inbox'}.</strong>
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        While you wait, scroll down to see exactly how much doing $15/hr admin work is really costing you.
      </div>
    </div>
  );
}
