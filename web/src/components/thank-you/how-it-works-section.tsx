/**
 * HowItWorksSection Component
 * Explains the 3-step process with future pacing
 * Bridges "I see the problem" → "I trust this solution"
 */

"use client";

export function HowItWorksSection() {
  return (
    <section
      style={{
        background: 'white',
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
        {/* How It Works */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '28px',
              color: '#0f172a',
              marginBottom: '12px',
            }}
          >
            Three Things Your Last Assistant Didn&apos;t Have
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            The right skills. The right system. The right support. Most companies give you one. We install all three.
          </p>
        </div>

        {/* 3 Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '48px',
          }}
          className="how-it-works-grid"
        >
          {/* Step 1 */}
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              backgroundColor: '#fafafa',
            }}
            className="how-it-works-step"
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                background: '#0f172a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '24px',
                  color: '#f59e0b',
                }}
              >
                1
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              The Right Person
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              9 out of 10 assistants were trained by busy founders who didn&apos;t know what they were doing. Our EAs think like operators.
            </p>
          </div>

          {/* Step 2 */}
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              backgroundColor: '#fafafa',
            }}
            className="how-it-works-step"
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                background: '#0f172a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '24px',
                  color: '#f59e0b',
                }}
              >
                2
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              The Right System
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              15-minute daily syncs, clear ownership zones, structured handoffs. No more &quot;I didn&apos;t know you wanted me to do that.&quot;
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              backgroundColor: '#fafafa',
            }}
            className="how-it-works-step"
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                background: '#0f172a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '24px',
                  color: '#f59e0b',
                }}
              >
                3
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
                textDecoration: 'underline',
                fontStyle: 'italic',
              }}
            >
              The Right Support
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              Our client success team oversees your relationship every day, proactively solving issues before they grow.
            </p>
          </div>
        </div>

        {/* 4-Week EA Accelerator Guarantee Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '24px',
              color: '#0f172a',
              marginBottom: '24px',
            }}
          >
            4-Week EA Accelerator Guarantee®
          </h3>

          {/* Sub-header with bullet points */}
          <div
            style={{
              maxWidth: '500px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '17px',
                color: '#0f172a',
                fontWeight: 700,
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              Most companies match you with an assistant and disappear. We do the opposite.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '15px',
                color: '#475569',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              In the first 4 weeks, we&apos;re in the trenches with you and your EA, building systems, transferring knowledge, and ensuring nothing falls through the cracks.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '15px',
                color: '#0f172a',
                marginBottom: '12px',
              }}
            >
              By Week 4, your EA <strong>owns</strong>:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
                paddingLeft: '20px',
                margin: 0,
                listStyleType: 'disc',
              }}
            >
              <li style={{ marginBottom: '8px' }}><strong style={{ color: '#0f172a' }}>Your inbox</strong> — you&apos;ll forget you ever managed it</li>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: '#0f172a' }}>Your calendar</strong> — no more playing Tetris with your schedule</li>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: '#0f172a' }}>Your recurring processes</strong> — the $15/hr work that eats your week</li>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: '#0f172a' }}>Your personal logistics</strong> — travel, birthdays, appointments handled</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .how-it-works-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
