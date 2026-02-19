/**
 * HeroPain Component
 * Navy hero section with the "highest-paid assistant" messaging
 * Matches lead-magnet-reference.html exactly
 */

"use client";

interface HeroPainProps {
  firstName: string;
  onCTAClick?: () => void;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function HeroPain({ firstName, onCTAClick }: HeroPainProps) {
  const displayName = capitalizeFirst(firstName.trim());

  return (
    <section
      className="hero"
      style={{
        background: '#0f172a',
        padding: '60px 0 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="hero-overlay"
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

      <div
        className="hero-content"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: 'clamp(32px, 5vw, 48px)',
            color: 'white',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          {displayName}, right now <span style={{ 
            backgroundColor: '#f59e0b', 
            color: '#0f172a', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontWeight: 600,
          }}>you</span> are the{' '}
          <span className="highlight" style={{ color: '#f59e0b' }}>
            highest-paid assistant
          </span>{' '}
          at your company
        </h1>

        {/* Subtitle */}
        <p
          className="hero-subtitle"
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            fontSize: 'clamp(16px, 4vw, 18px)',
            color: '#94a3b8',
            maxWidth: '500px',
            margin: '0 auto 40px',
          }}
        >
          Every hour you spend on $15/hr tasks is an hour you&apos;re not
          spending on what actually grows your business.
        </p>

        {/* CTA Button - Book Your Time Audit */}
        <button
          onClick={onCTAClick}
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0f172a',
            border: 'none',
            padding: '16px 32px',
            fontSize: 'clamp(16px, 4vw, 18px)',
            fontWeight: 700,
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            letterSpacing: '-0.01em',
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
          Book Your Time Audit
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
