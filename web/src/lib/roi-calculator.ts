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

// Revenue ranges mapped to realistic CEO hourly rates
export const REVENUE_MAPPINGS: RevenueMapping[] = [
  { range: 'Under $500k', midpoint: 250000, ceoHourlyRate: 100 },
  { range: '$500k-$1M', midpoint: 750000, ceoHourlyRate: 300 },
  { range: '$1M-$3M', midpoint: 2000000, ceoHourlyRate: 300 },
  { range: '$3M-$5M', midpoint: 4000000, ceoHourlyRate: 500 },
  { range: '$5M-$10M', midpoint: 7500000, ceoHourlyRate: 750 },
  { range: 'Over $10M', midpoint: 15000000, ceoHourlyRate: 1000 },
];

// Weekly hours by revenue tier
export const WEEKLY_HOURS_BY_REVENUE: Record<string, number> = {
  'Under $500k': 15,
  '$500k-$1M': 15,        // 12 + 25%
  '$1M-$3M': 19,          // 15 + 25%
  '$3M-$5M': 19,          // 15 + 25%
  '$5M-$10M': 15,         // 12 + 25%
  'Over $10M': 12,        // 10 + 25%
};

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

/**
 * Get weekly hours from revenue range string
 */
export function getWeeklyHoursByRevenue(revenueRange: string): number {
  return WEEKLY_HOURS_BY_REVENUE[revenueRange] ?? 15; // Default 15 hrs if not found
}

/**
 * Get TaskHours object distributed across categories based on revenue tier
 */
export function getTaskHoursByRevenue(revenueRange: string): TaskHours {
  const totalHours = getWeeklyHoursByRevenue(revenueRange);
  // Distribute hours across categories (roughly equal with slight variation)
  const emailHours = Math.round(totalHours * 0.30); // 30% on email
  const personalLifeHours = Math.round(totalHours * 0.20); // 20% on personal
  const calendarHours = Math.round(totalHours * 0.20); // 20% on calendar
  const businessProcessesHours = totalHours - emailHours - personalLifeHours - calendarHours; // remainder

  return {
    email: emailHours,
    personalLife: personalLifeHours,
    calendar: calendarHours,
    businessProcesses: businessProcessesHours,
  };
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
