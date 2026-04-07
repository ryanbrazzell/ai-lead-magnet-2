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
          You&apos;ve seen the cost. {annualHours}+ hours per year. Now let&apos;s fix it.
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
          Schedule your call and we&apos;ll walk you through the exact delegation system that frees up your calendar for growth work.
        </p>
        <button
          onClick={handleClick}
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0f172a',
            padding: '16px 32px',
            borderRadius: '50px',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 32px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)';
          }}
        >
          Book Your EA Delegation Roadmap Call
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
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
