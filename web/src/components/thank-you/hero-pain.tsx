/**
 * HeroPain Component
 * Navy hero section with the "highest-paid assistant" messaging
 * Matches lead-magnet-reference.html exactly
 */

"use client";

interface HeroPainProps {
  firstName: string;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function HeroPain({ firstName }: HeroPainProps) {
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
      </div>
    </section>
  );
}
