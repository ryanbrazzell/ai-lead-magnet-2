/**
 * CTASection Component
 * "Want help making sense of your report?" section with iClosed calendar
 */

"use client";

interface CTASectionProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export function CTASection({
  firstName = '',
  lastName = '',
  email = '',
  phone = '',
}: CTASectionProps) {
  // Build iClosed URL with pre-filled data
  const baseUrl = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  const params = new URLSearchParams();

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (fullName) params.set('iclosedName', fullName);
  if (email) params.set('iclosedEmail', email);
  if (phone) params.set('iclosedPhone', phone);
  
  // Set time format to 12-hour (AM/PM)
  params.set('timeFormat', '12h');

  const iClosedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  return (
    <section
      id="schedule-call-section"
      style={{
        background: 'white',
        padding: '48px 0',
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
            fontSize: 'clamp(22px, 6vw, 28px)',
            marginBottom: '12px',
            color: '#0f172a',
          }}
        >
          Ready to stop being the bottleneck?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            color: '#475569',
            marginBottom: '32px',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          In 30 minutes, we&apos;ll show you exactly which tasks to hand off first — and how to do it without the training headache.
        </p>

        {/* iClosed Calendar Widget */}
        <div
          id="calendar-section"
          style={{
            width: '100%',
            minHeight: '600px',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '12px',
            marginBottom: '8px',
          }}
        >
          <iframe
            src={iClosedUrl}
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              borderRadius: '12px',
            }}
            title="Schedule a call - Executive Assistant Discovery"
            allow="payment"
          />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            fontSize: '13px',
            color: '#94a3b8',
            marginBottom: '32px',
          }}
        >
          No pressure. Just a quick chat to see if we can help.
        </div>

        {/* Objection Handling */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
          className="objection-grid"
        >
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              &quot;Won&apos;t training take forever?&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '13px',
                color: '#475569',
                margin: 0,
              }}
            >
              Our 4-week accelerator handles onboarding. Most founders delegate within the first week.
            </p>
          </div>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              &quot;What if they can&apos;t handle my business?&quot;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontSize: '13px',
                color: '#475569',
                margin: 0,
              }}
            >
              We&apos;ve matched 1,300+ founders across coaching, agencies, SaaS, and more. We&apos;ll find your fit.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .objection-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

