/**
 * FAQSection Component
 * Objection handling FAQ cards
 */

"use client";

const faqs = [
  {
    question: "What's the difference between a VA and an EA?",
    answer:
      "VAs handle tasks you assign. EAs own outcomes. Our EAs are trained to think like operators — they anticipate what needs to happen, not just execute what you tell them.",
  },
  {
    question: "How is this different from Upwork or hiring myself?",
    answer:
      "When you hire yourself, you're also training, managing, and fixing mistakes yourself. We handle vetting, training, and ongoing support. If something's not working, we fix it — you don't have to start over.",
  },
  {
    question: "I've tried VAs before and they didn't work out.",
    answer:
      "That's exactly why we exist. Most assistants fail because they lack systems and support. Our client success team oversees your relationship every single day — proactively pointing out issues before they become problems and helping expand your EA's scope over time.",
  },
  {
    question: "What if it doesn't work out?",
    answer:
      "Nobody gets to week 4 without being successful — or we refund you. No contracts, cancel anytime. But our daily oversight means problems get solved before they grow. We don't let people fail.",
  },
  {
    question: "How long until I see results?",
    answer:
      "Most founders are delegating real work within the first week. By week 4, your EA owns your email, calendar, and recurring processes. The goal is for you to forget you ever did those things.",
  },
];

export function FAQSection() {
  return (
    <section
      style={{
        background: '#f8fafc',
        padding: '48px 0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: 'clamp(22px, 5vw, 28px)',
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          Common Questions
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px',
                }}
              >
                &quot;{faq.question}&quot;
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  color: '#475569',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
