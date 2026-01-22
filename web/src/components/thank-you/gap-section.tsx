/**
 * GapSection Component
 * Creates emotional gap between current state and desired state
 * Shows what founders with the right EA actually experience
 *
 * This is the missing piece that bridges "here's what you're losing"
 * to "here's our solution" - creating desire before presenting the fix
 */

"use client";

export function GapSection() {
  return (
    <section
      style={{
        background: '#0f172a',
        padding: '60px 0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '12px',
            }}
          >
            Meanwhile...
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(24px, 5vw, 32px)',
              color: 'white',
              marginBottom: '12px',
              lineHeight: 1.3,
            }}
          >
            Here&apos;s What Founders With The Right EA (and systems) <br />
            <span style={{ color: '#f59e0b' }}>Actually Experience</span>
          </h2>
        </div>

        {/* Outcome Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '40px',
          }}
          className="gap-section-grid"
        >
          {/* Card 1 */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
            }}
            className="gap-card"
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: '20px',
                color: 'white',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}
            >
              &quot;I haven&apos;t looked at my email in 2 weeks.&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Your EA triages, responds, and only escalates what truly needs you.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
            }}
            className="gap-card"
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: '20px',
                color: 'white',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}
            >
              &quot;I just show up. My EA runs my calendar.&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              No more Tetris. No more double-bookings. No more &quot;let me check my calendar.&quot;
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
            }}
            className="gap-card"
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: '20px',
                color: 'white',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}
            >
              &quot;I went from 60 hours to a 9-to-4 schedule.&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              When someone else handles the $15/hr work, you get your life back.
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
            }}
            className="gap-card"
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: '20px',
                color: 'white',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}
            >
              &quot;Finally took a real vacation — no laptop.&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Your EA keeps the wheels turning while you actually disconnect.
            </p>
          </div>
        </div>

        {/* Transition Statement */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '16px',
              color: '#94a3b8',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            This isn&apos;t about hiring another assistant. <br />
            <span style={{ color: 'white', fontWeight: 600 }}>
              It&apos;s about getting the right system in place from day one.
            </span>
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .gap-section-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
