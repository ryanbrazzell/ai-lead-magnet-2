"use client";

import type { AbStats, VariationStats } from '@/lib/close/ab-stats';
import { ConversionChart } from './conversion-chart';

interface DashboardViewProps {
  stats: AbStats | null;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function StatColumn({ label, stats }: { label: string; stats: VariationStats }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <h2 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>{label}</h2>
      <Metric label="Visits" value={String(stats.visits)} />
      <Metric label="Booked calls" value={String(stats.booked)} />
      <Metric label="Conversion rate" value={pct(stats.rate)} emphasis />
    </div>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
      <span
        style={{
          color: emphasis ? '#10b981' : '#0f172a',
          fontWeight: emphasis ? 700 : 500,
          fontSize: emphasis ? '18px' : '14px',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function DashboardView({ stats }: DashboardViewProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        padding: '32px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', color: '#0f172a' }}>/report A/B Test</h1>

        {stats === null ? (
          <p style={{ color: '#dc2626' }}>
            Could not load stats from Close CRM. Check CLOSE_API_KEY and try again.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <StatColumn label="Control" stats={stats.control} />
              <StatColumn label="Video" stats={stats.video} />
            </div>
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '16px',
              }}
            >
              <h2 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>
                Conversion rate
              </h2>
              <ConversionChart controlRate={stats.control.rate} videoRate={stats.video.rate} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '12px' }}>
              Live from Close CRM. Generated {new Date(stats.generatedAt).toLocaleString()}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
