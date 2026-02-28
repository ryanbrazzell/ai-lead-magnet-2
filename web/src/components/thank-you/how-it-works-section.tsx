/**
 * HowItWorksSection Component
 * Pain points, 3-step process with future pacing, and guarantee
 * Bridges "I see the problem" -> "I trust this solution"
 */

"use client";

import * as React from 'react';

interface HowItWorksSectionProps {
  onCTAClick?: () => void;
}

export function HowItWorksSection({ onCTAClick }: HowItWorksSectionProps) {
  const painPoints: React.ReactNode[] = [
    <>You&apos;re <strong>frustrated</strong> every single day and starting to think it&apos;s just you</>,
    <>You&apos;ve hired &ldquo;<strong>VAs</strong>&rdquo; before and it never worked out (not EAs)</>,
    <>You&apos;re still doing everything <strong>yourself</strong> because &ldquo;no one does it like you&rdquo;</>,
    <>Every time you delegate, you end up <strong>redoing</strong> it anyway</>,
    <>You&apos;re constantly checking in, following up, <strong>holding their hand</strong></>,
    <>They finish a task and ask &ldquo;<strong>what&apos;s next?</strong>&rdquo; instead of just knowing</>,
    <>You can&apos;t step away without something <strong>falling apart</strong></>,
    <>Random fires keep pulling you <strong>back into the weeds</strong></>,
    <>Two months in, they quit and you&apos;re <strong>starting from scratch</strong> again</>,
    <>You don&apos;t trust anyone to actually <strong>own</strong> something in your business</>,
    <>You keep hoping the next hire will be &ldquo;<strong>The One</strong>&rdquo; that fixes everything</>,
  ];

  const guaranteeItems = [
    { bold: "Your inbox", rest: "you\u2019ll forget you ever managed it" },
    { bold: "Your calendar", rest: "no more playing Tetris with your schedule" },
    { bold: "Your recurring processes", rest: "the $15/hr work that eats your week" },
    { bold: "Your personal logistics", rest: "travel, birthdays, appointments handled" },
  ];

  return (
    <section
      style={{
        background: "white",
      }}
    >
      {/* Pain Points Section */}
      <div
        style={{
          background: "white",
          padding: "60px 0",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: "28px",
              color: "#0f172a",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            Maybe you&apos;ve tried to hire an assistant on your own or from a &quot;BIG agency&quot;
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {painPoints.map((point, index) => (
              <div
                key={index}
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "15px",
                  color: "#334155",
                  padding: "12px 16px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  lineHeight: 1.5,
                }}
              >
                {point}
              </div>
            ))}
          </div>

{/* Removed duplicate heading - moved to "Three Things" section below */}
        </div>
      </div>

      {/* Three Things / How It Works Section */}
      <div
        style={{
          background: "#f8fafc",
          padding: "60px 0",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          {/* How It Works */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: "28px",
                color: "#0f172a",
                marginBottom: "12px",
              }}
            >
              Executive Assistants Done the{" "}
              <span style={{ fontWeight: 700, textDecoration: "underline" }}>Right</span> Way
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                color: "#475569",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              We&apos;ve helped over 1,300 founders and executives (like you) scale their business and buy back their time. Here&apos;s how we do it:
            </p>
          </div>

          {/* 3 Steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
              marginBottom: "0",
            }}
            className="how-it-works-grid"
          >
            {/* Step 1 */}
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                backgroundColor: "#fafafa",
              }}
              className="how-it-works-step"
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#0f172a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                    fontSize: "24px",
                    color: "#f59e0b",
                  }}
                >
                  1
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                The Right{" "}
                <span style={{ fontWeight: 700, textDecoration: "underline" }}>Person</span>
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "14px",
                  color: "#475569",
                }}
              >
                9 out of 10 assistants were trained by busy founders who didn&apos;t know what they were doing. Our EAs think like operators.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                backgroundColor: "#fafafa",
              }}
              className="how-it-works-step"
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#0f172a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                    fontSize: "24px",
                    color: "#f59e0b",
                  }}
                >
                  2
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                The Right{" "}
                <span style={{ fontWeight: 700, textDecoration: "underline" }}>System</span>
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "14px",
                  color: "#475569",
                }}
              >
                15-minute daily syncs, clear ownership zones, structured handoffs. No more &quot;I didn&apos;t know you wanted me to do that.&quot;
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                backgroundColor: "#fafafa",
              }}
              className="how-it-works-step"
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#0f172a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                    fontSize: "24px",
                    color: "#f59e0b",
                  }}
                >
                  3
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                The Right{" "}
                <span style={{ fontWeight: 700, textDecoration: "underline" }}>Support</span>
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "14px",
                  color: "#475569",
                }}
              >
                Our client success team oversees your relationship every day, proactively solving issues before they grow.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              onClick={onCTAClick}
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#0f172a",
                fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                fontWeight: 700,
                fontSize: "16px",
                borderRadius: "50px",
                padding: "16px 32px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: "0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 32px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)";
              }}
            >
              Book your FREE Time Strategy Call
            </button>
          </div>
        </div>
      </div>

      {/* === Guarantee Section (visually distinct) === */}
      <div
        style={{
          background: "white",
          padding: "60px 0",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          {/* 4-Week EA Accelerator Guarantee Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              border: "2px solid #10b981",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                fontSize: "24px",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              Our Four-Week EA Accelerator Guarantee
            </h3>

            {/* Sub-header with checkbox items */}
            <div
              style={{
                maxWidth: "500px",
                margin: "0 auto",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "17px",
                  color: "#0f172a",
                  fontWeight: 700,
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                By week 4 your EA owns:
              </p>

              {/* Checkbox-style list */}
              <div style={{ marginBottom: "16px" }}>
                {guaranteeItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                      fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                      fontSize: "14px",
                      color: "#475569",
                    }}
                  >
                    {/* Green checkbox */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        minWidth: "22px",
                        background: "#10b981",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        marginTop: "1px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 7L6 10L11 4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>
                      <strong style={{ color: "#0f172a", textDecoration: "underline", textDecorationColor: "#f59e0b", textUnderlineOffset: "3px" }}>{item.bold}</strong> &mdash; {item.rest}
                    </span>
                  </div>
                ))}
              </div>

              {/* Guarantee Badge */}
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      border: "3px solid #10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "white",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#10b981" />
                      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#10b981",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Guaranteed
                  </span>
                </div>
              </div>

              {/* Supporting text */}
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "15px",
                  color: "#475569",
                  marginTop: "24px",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                In the first four weeks we&apos;re in the trenches with you and your EA, building systems, transferring knowledge, and ensuring nothing falls through the cracks.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: "15px",
                  color: "#0f172a",
                  fontWeight: 600,
                  marginTop: "12px",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Feel the support of your EA by week 4, guaranteed.
              </p>
            </div>
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
