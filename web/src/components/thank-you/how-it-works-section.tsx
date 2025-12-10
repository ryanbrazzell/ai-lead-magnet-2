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
            How Assistant Launch Solves This Problem
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            Get your time back in 3 simple steps
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
              padding: '16px 24px',
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
              Right Person
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              We pair you with a highly vetted EA, fully trained on buy back your time principles and AI.
            </p>
          </div>

          {/* Step 2 */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px 24px',
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
              Right Process
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              Our 4-week accelerator integrates your assistant, so you&apos;re both operating at the highest level.
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px 24px',
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
              Right Support
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              <em>Actual Support</em> – We oversee and improve your relationship every day to guarantee you never fail.
            </p>
          </div>
        </div>

        {/* Future Pacing Box */}
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
            Imagine when you wake up...
          </h3>

          {/* Main checkmark point */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }}>✓</span>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '16px',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              You are working <span style={{ textDecoration: 'underline' }}>ON</span> the business instead of <span style={{ textDecoration: 'underline' }}>IN</span> it
            </span>
          </div>

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
                fontSize: '15px',
                color: '#0f172a',
                fontWeight: 600,
                marginBottom: '12px',
                paddingLeft: '32px',
              }}
            >
              Your assistant owns and manages:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                color: '#475569',
                paddingLeft: '52px',
                margin: 0,
                listStyleType: 'disc',
              }}
            >
              <li style={{ marginBottom: '6px' }}>Your email</li>
              <li style={{ marginBottom: '6px' }}>Your personal life</li>
              <li style={{ marginBottom: '6px' }}>The recurring processes in the business</li>
              <li>Your time and energy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .how-it-works-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .how-it-works-step {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 24px !important;
            margin-bottom: 8px;
          }
          .how-it-works-step:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
        }
      `}</style>
    </section>
  );
}
