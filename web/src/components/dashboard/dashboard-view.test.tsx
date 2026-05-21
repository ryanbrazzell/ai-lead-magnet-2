import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from './dashboard-view';
import type { AbStats } from '@/lib/close/ab-stats';

// recharts needs layout measurement that jsdom lacks - stub the chart.
vi.mock('./conversion-chart', () => ({
  ConversionChart: () => <div data-testid="conversion-chart" />,
}));

const stats: AbStats = {
  control: { visits: 100, booked: 2, rate: 0.02 },
  video: { visits: 100, booked: 6, rate: 0.06 },
  generatedAt: '2026-05-20T00:00:00.000Z',
};

describe('DashboardView', () => {
  it('shows visit and booked counts for both variations', () => {
    render(<DashboardView stats={stats} />);
    expect(screen.getByText('Control')).toBeDefined();
    expect(screen.getByText('Video')).toBeDefined();
    // Both variations have 100 visits.
    expect(screen.getAllByText('100').length).toBe(2);
    expect(screen.getByText('2')).toBeDefined(); // control booked
    expect(screen.getByText('6')).toBeDefined(); // video booked
  });

  it('renders conversion rates as percentages', () => {
    render(<DashboardView stats={stats} />);
    expect(screen.getByText('2.0%')).toBeDefined();
    expect(screen.getByText('6.0%')).toBeDefined();
  });

  it('shows a data-unavailable message when stats is null', () => {
    render(<DashboardView stats={null} />);
    expect(screen.getByText(/could not load/i)).toBeDefined();
  });
});
