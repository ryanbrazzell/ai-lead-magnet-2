/**
 * OverwhelmSection Component
 * Creates anxiety by showing everything they're still doing themselves,
 * then immediately shows tangible proof of what clients stopped doing.
 *
 * Based on Nehal's feedback: "educate, overwhelm and book a call"
 * The goal is to make them feel the weight of what they're carrying,
 * then show them the other side.
 */

"use client";

const checklistItems: string[] = [
  "Keeping a constant \"Email To-Do\" List",
  "Scheduling and rescheduling meetings",
  "Fielding every decision and request yourself",
  "Building decks and presentations yourself",
  "Carrying open loops in your head constantly",
  "Booking your own flights and hotels",
  "Following up on things you delegate",
  "Checking email nights and weekends",
  "Staying glued to Slack/WhatsApp answering questions",
  "Handling personal tasks (appointments, vendors, etc.)",
  "Letting opportunities slip because you're buried",
  "Working through vacations because no one else can cover",
  "Updating your CRM manually",
];

const clientProofs = [
  {
    quote: "I haven't touched my inbox in 3 weeks. Anne handles it all — I just get the highlights that actually matter.",
    name: "Keri F.",
    role: "Founder",
    revenue: "$1.2M/year",
  },
  {
    quote: "Went from 7 days a week grinding to focused work hours. Aileen runs my entire schedule — I just show up where I'm needed.",
    name: "David H.",
    role: "CFO",
    revenue: "$3M/year",
  },
  {
    quote: "Took a 2-week vacation without touching my laptop. Maria kept everything running — clients didn't even notice I was gone.",
    name: "Jake K.",
    role: "Founder",
    revenue: "$800K/year",
  },
  {
    quote: "She proactively built SOPs we didn't even ask for. Now my team runs itself — I'm finally working ON the business, not IN it.",
    name: "Mitch S.",
    role: "Co-founder",
    revenue: "$2.5M/year",
  },
];

export function OverwhelmSection() {
  return (
    <section
      style={{
        background: '#f8fafc',
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
        {/* Part 1: The Checklist (Creates Anxiety) */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: 'clamp(24px, 5vw, 32px)',
                color: '#0f172a',
                marginBottom: '12px',
              }}
            >
              Still doing all of this yourself?
            </h2>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: '#f59e0b', margin: '0 auto 8px' }}
            >
              <path
                d="M12 4v16m0 0l-6-6m6 6l6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                color: '#475569',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              Most founders check 8+ of these boxes. Our clients check zero.
            </p>
          </div>

          {/* Checklist Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
            className="checklist-grid"
          >
            {checklistItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                {/* Unchecked checkbox */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    color: '#334155',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider with arrow */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: 'clamp(20px, 4vw, 24px)',
                color: '#0f172a',
                textAlign: 'center',
              }}
            >
              Meanwhile, here&apos;s what founders with the right EA<br />
              <span style={{ color: '#f59e0b' }}>(and systems)</span> actually experience:
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: '#f59e0b', marginTop: '8px' }}
            >
              <path
                d="M12 4v16m0 0l-6-6m6 6l6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Part 2: Client Proof (Creates Desire) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
          className="proof-grid"
        >
          {clientProofs.map((proof, index) => (
            <div
              key={index}
              style={{
                background: '#0f172a',
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
              }}
            >
              {/* Checkmark badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  background: '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '18px',
                  color: 'white',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                &quot;{proof.quote}&quot;
              </p>
              <div
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    {proof.name}
                  </span>
                  <span style={{ color: '#94a3b8' }}> — {proof.role}</span>
                </div>
                <span
                  style={{
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {proof.revenue}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Transition Statement */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '16px',
              color: '#475569',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            This isn&apos;t about hiring another assistant. <br />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              It&apos;s about getting the right system in place from day one.
            </span>
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .checklist-grid {
            grid-template-columns: 1fr !important;
          }
          .proof-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
