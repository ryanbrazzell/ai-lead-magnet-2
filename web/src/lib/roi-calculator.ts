/**
 * ROI Calculator Utilities
 *
 * Calculates CEO hourly rate based on revenue tier and computes
 * annual revenue unlocked by delegating tasks to an EA.
 */

export interface RevenueMapping {
  range: string;
  midpoint: number;
  ceoHourlyRate: number;
}

// Revenue ranges mapped to midpoints and CEO hourly rates
// CEO Hourly Rate = Midpoint / 2,000 working hours per year
export const REVENUE_MAPPINGS: RevenueMapping[] = [
  { range: 'Under $100k', midpoint: 50000, ceoHourlyRate: 25 },
  { range: '$100k to $250k', midpoint: 175000, ceoHourlyRate: 88 },
  { range: '$250K to $500k', midpoint: 375000, ceoHourlyRate: 188 },
  { range: '$500k to $1M', midpoint: 750000, ceoHourlyRate: 375 },
  { range: '$1M to $3M', midpoint: 2000000, ceoHourlyRate: 1000 },
  { range: '$3M to $10M', midpoint: 6500000, ceoHourlyRate: 3250 },
  { range: '$10M to $30M', midpoint: 20000000, ceoHourlyRate: 10000 },
  { range: '$30 Million+', midpoint: 50000000, ceoHourlyRate: 25000 },
];

// EA assistant annual investment
export const EA_ANNUAL_INVESTMENT = 33000; // $2,750/month x 12

/**
 * Get CEO hourly rate from revenue range string
 */
export function getCeoHourlyRate(revenueRange: string): number {
  const mapping = REVENUE_MAPPINGS.find(m => m.range === revenueRange);
  return mapping?.ceoHourlyRate ?? 100; // Default $100/hr if not found
}

/**
 * Get revenue midpoint from revenue range string
 */
export function getRevenueMidpoint(revenueRange: string): number {
  const mapping = REVENUE_MAPPINGS.find(m => m.range === revenueRange);
  return mapping?.midpoint ?? 100000;
}

export interface TaskHours {
  email: number;
  personalLife: number;
  calendar: number;
  businessProcesses: number;
}

export interface ROICalculation {
  // Input data
  weeklyHoursDelegated: number;
  ceoHourlyRate: number;
  revenueRange: string;

  // Calculated values
  monthlyHoursUnlocked: number;
  monthlyRevenueUnlocked: number;
  annualRevenueUnlocked: number;

  // ROI breakdown
  eaInvestment: number;
  netReturn: number;
  roiMultiplier: number;

  // Per-category breakdown
  categoryBreakdown: {
    category: string;
    weeklyHours: number;
    annualCost: number;
  }[];
}

/**
 * Calculate full ROI based on task hours and revenue tier
 */
export function calculateROI(
  taskHours: TaskHours,
  revenueRange: string
): ROICalculation {
  const ceoHourlyRate = getCeoHourlyRate(revenueRange);
  const weeklyHoursDelegated = Object.values(taskHours).reduce((sum, h) => sum + h, 0);

  // Monthly calculations
  const monthlyHoursUnlocked = weeklyHoursDelegated * 4; // ~4 weeks per month
  const monthlyRevenueUnlocked = monthlyHoursUnlocked * ceoHourlyRate;

  // Annual calculations
  const annualRevenueUnlocked = weeklyHoursDelegated * 52 * ceoHourlyRate;

  // ROI breakdown
  const eaInvestment = EA_ANNUAL_INVESTMENT;
  const netReturn = annualRevenueUnlocked - eaInvestment;
  const roiMultiplier = annualRevenueUnlocked / eaInvestment;

  // Per-category breakdown
  const categoryBreakdown = [
    { category: 'Managing Email', weeklyHours: taskHours.email, annualCost: taskHours.email * 52 * ceoHourlyRate },
    { category: 'Personal Life', weeklyHours: taskHours.personalLife, annualCost: taskHours.personalLife * 52 * ceoHourlyRate },
    { category: 'Calendar & Booking', weeklyHours: taskHours.calendar, annualCost: taskHours.calendar * 52 * ceoHourlyRate },
    { category: 'Business Processes', weeklyHours: taskHours.businessProcesses, annualCost: taskHours.businessProcesses * 52 * ceoHourlyRate },
  ];

  return {
    weeklyHoursDelegated,
    ceoHourlyRate,
    revenueRange,
    monthlyHoursUnlocked,
    monthlyRevenueUnlocked,
    annualRevenueUnlocked,
    eaInvestment,
    netReturn,
    roiMultiplier,
    categoryBreakdown,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ROI multiplier for display (e.g., "15.2x")
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}
