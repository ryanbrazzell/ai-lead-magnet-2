/**
 * ReportHeader Component
 * Simple navy header with logo matching lead-magnet-reference.html exactly
 */

"use client";

export function ReportHeader() {
  return (
    <header
      style={{
        background: '#0f172a',
        padding: '16px 0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <a
          href="https://www.assistantlaunch.com"
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: '24px',
            color: '#f59e0b',
            textDecoration: 'none',
          }}
        >
          Assistant Launch 🚀
        </a>
      </div>
    </header>
  );
}

