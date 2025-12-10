/**
 * FinalCTASection Component
 * "Ready to get your 520 hours back?" section with email reminder
 * Matches lead-magnet-reference.html exactly
 */

"use client";

interface FinalCTASectionProps {
  annualHours: number;
  onButtonClick?: () => void;
}

export function FinalCTASection({ annualHours, onButtonClick }: FinalCTASectionProps) {
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      // Default: scroll to the top of the schedule call section container
      document.getElementById('schedule-call-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: 'clamp(48px, 10vw, 80px) 0',
        textAlign: 'center',
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
            fontSize: 'clamp(28px, 7vw, 36px)',
            color: 'white',
            marginBottom: '16px',
          }}
        >
          Ready to spend {annualHours} hours on growth instead of admin?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            color: '#94a3b8',
            marginBottom: '32px',
            maxWidth: '450px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Let&apos;s show you exactly how to delegate these tasks — without the months of training.
        </p>
        <button
          onClick={handleClick}
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            color: '#0f172a',
            padding: 'clamp(14px, 4vw, 18px) clamp(24px, 6vw, 36px)',
            borderRadius: '8px',
            fontSize: 'clamp(16px, 4vw, 18px)',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Show Me How To Delegate This
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0L8.59 1.41 14.17 7H0v2h14.17l-5.58 5.59L10 16l8-8-8-8z" fill="currentColor" />
          </svg>
        </button>

        {/* Email Reminder */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '16px 24px',
            marginTop: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <strong
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                display: 'block',
                color: '#0f172a',
                fontSize: '14px',
              }}
            >
              Don&apos;t forget to check your inbox
            </strong>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                color: '#475569',
                fontSize: '13px',
              }}
            >
              Your full Time Freedom Report has the complete breakdown
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

