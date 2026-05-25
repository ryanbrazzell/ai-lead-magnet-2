/**
 * OverwhelmSection Component
 * Interactive job-description checklist that builds anxiety,
 * then shows CEO efficiency rate + client proof.
 *
 * Based on Nehal's feedback: "educate, overwhelm and book a call"
 */

"use client";

import * as React from 'react';

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
    quote: "I haven't touched my inbox in 3 weeks. Anne handles it all - I just get the highlights that actually matter.",
    name: "Keri F.",
    role: "Founder",
    revenue: "$1.2M/year",
  },
  {
    quote: "Went from 7 days a week grinding to focused work hours. Aileen runs my entire schedule - I just show up where I'm needed.",
    name: "David H.",
    role: "CFO",
    revenue: "$3M/year",
  },
  {
    quote: "Took a 2-week vacation without touching my laptop. Maria kept everything running - clients didn't even notice I was gone.",
    name: "Jake K.",
    role: "Founder",
    revenue: "$800K/year",
  },
  {
    quote: "She proactively built SOPs we didn't even ask for. Now my team runs itself - I'm finally working ON the business, not IN it.",
    name: "Mitch S.",
    role: "Co-founder",
    revenue: "$2.5M/year",
  },
];

// CEO efficiency rate color based on checked count
function getEfficiencyColor(checked: number): string {
  if (checked >= 8) return '#ef4444'; // red - critical
  if (checked >= 4) return '#f59e0b'; // amber - warning
  return '#10b981'; // green - good
}

function getEfficiencyLabel(checked: number): string {
  if (checked >= 10) return 'Critical';
  if (checked >= 8) return 'Overloaded';
  if (checked >= 5) return 'Stretched';
  if (checked >= 3) return 'Warning';
  return 'Healthy';
}

interface OverwhelmSectionProps {
  onCTAClick?: () => void;
  /** When true, render only Part 2 (Client Proof) - used by the video variation. */
  clientProofOnly?: boolean;
}

export function OverwhelmSection({ onCTAClick, clientProofOnly }: OverwhelmSectionProps) {
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());
  const [efficiencyRevealed, setEfficiencyRevealed] = React.useState(false);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const checkedCount = checkedItems.size;
  const efficiencyPercent = Math.round((checkedCount / checklistItems.length) * 100);
  const efficiencyColor = getEfficiencyColor(checkedCount);
  const efficiencyLabel = getEfficiencyLabel(checkedCount);

  // SVG circle math
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (efficiencyPercent / 100) * circleCircumference;

  const font = {
    sans: 'var(--font-dm-sans), "DM Sans", sans-serif',
    serif: 'var(--font-dm-serif), "DM Serif Display", serif',
  };

  return (
    <>
      {/* ===== Part 1: Checklist + CEO Efficiency (white bg) - hidden in video variant ===== */}
      {!clientProofOnly && (
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
          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(24px, 5vw, 32px)',
                color: '#0f172a',
                marginBottom: '12px',
              }}
            >
              Read this job description.{' '}
              <span style={{ color: '#f59e0b' }}>Sound familiar?</span>
            </h2>
            <p
              style={{
                fontFamily: font.sans,
                color: '#475569',
                maxWidth: '500px',
                margin: '0 auto',
                fontSize: '16px',
              }}
            >
              Put a check next to every task you&apos;re still doing yourself, and we&apos;ll show you your CEO efficiency rate.
            </p>
          </div>

          {/* Checklist Grid - Interactive */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '40px',
            }}
            className="checklist-grid"
          >
            {checklistItems.map((item, index) => {
              const isChecked = checkedItems.has(index);
              return (
                <button
                  key={index}
                  onClick={() => toggleItem(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: isChecked ? '#fef3c7' : '#f8fafc',
                    border: isChecked ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                    outline: 'none',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      minWidth: '22px',
                      border: isChecked ? '2px solid #f59e0b' : '2px solid #cbd5e1',
                      borderRadius: '4px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isChecked ? '#f59e0b' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M11.5 3.5L5.5 10.5L2.5 7.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: font.sans,
                      fontSize: '14px',
                      color: isChecked ? '#92400e' : '#334155',
                      fontWeight: isChecked ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CEO Efficiency Rate - with click-to-reveal */}
          {checkedCount > 0 && (
            <div
              style={{
                textAlign: 'center',
                animation: 'fadeInUp 0.4s ease-out',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '400px',
                  margin: '0 auto',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Blurred overlay when not revealed */}
                {!efficiencyRevealed && (
                  <div
                    onClick={() => setEfficiencyRevealed(true)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'rgba(248, 250, 252, 0.85)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  >
                    {/* Lock icon */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <p
                      style={{
                        fontFamily: font.sans,
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 4px',
                      }}
                    >
                      Tap to reveal your CEO efficiency rate
                    </p>
                    <p
                      style={{
                        fontFamily: font.sans,
                        fontSize: '13px',
                        color: '#64748b',
                        margin: 0,
                      }}
                    >
                      Based on your {checkedCount} selection{checkedCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Actual content (always rendered, blurred when hidden) */}
                <p
                  style={{
                    fontFamily: font.sans,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    color: '#475569',
                    marginBottom: '20px',
                  }}
                >
                  Your CEO Efficiency Rate
                </p>

                {/* SVG Circle */}
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 20px' }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="70"
                      cy="70"
                      r={circleRadius}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={circleRadius}
                      fill="none"
                      stroke={efficiencyColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font.serif,
                        fontSize: '36px',
                        color: efficiencyColor,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {efficiencyPercent}%
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: font.sans,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: efficiencyColor,
                    margin: '0 0 8px',
                    transition: 'color 0.3s ease',
                  }}
                >
                  Status: {efficiencyLabel}
                </p>

                <p
                  style={{
                    fontFamily: font.sans,
                    fontSize: '15px',
                    color: '#0f172a',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  You checked <span style={{ fontWeight: 700, color: efficiencyColor }}>{checkedCount}</span> of {checklistItems.length}.{' '}
                  <span style={{ fontWeight: 700 }}>
                    You just wrote an assistant&apos;s job description.
                  </span>
                </p>
                <p
                  style={{
                    fontFamily: font.sans,
                    fontSize: '14px',
                    color: '#475569',
                    margin: '8px 0 0',
                  }}
                >
                  Most founders select 8+.{' '}
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Our clients check ZERO.</span>
                </p>
              </div>

              {/* CTA after efficiency reveal */}
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={onCTAClick}
                  style={{
                    fontFamily: font.sans,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '16px',
                    borderRadius: '50px',
                    padding: '16px 32px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
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
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ===== Part 2: Client Proof (navy bg - distinct section) ===== */}
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
          {/* Section heading */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(22px, 5vw, 28px)',
                color: 'white',
                marginBottom: '8px',
              }}
            >
              What working with an Assistant Launch
              <br />
              Executive Assistant actually looks like
            </h2>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: '#f59e0b', margin: '8px auto 0', display: 'block' }}
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

          {/* Client Proof Cards */}
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
                  background: '#1e293b',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                    fontFamily: font.serif,
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
                    fontFamily: font.sans,
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
                    <span style={{ color: '#94a3b8' }}> - {proof.role}</span>
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

          {/* Transition statement */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p
              style={{
                fontFamily: font.sans,
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
      </section>

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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
