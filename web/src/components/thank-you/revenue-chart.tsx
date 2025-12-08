/**
 * Revenue Projection Chart
 *
 * Shows 12-month revenue projection comparing:
 * - Current trajectory (without EA)
 * - Projected revenue with Executive Assistant
 *
 * Uses an area chart to visualize the "opportunity gap"
 */

"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RevenueChartProps {
  /** Current annual revenue */
  currentRevenue: number;
  /** Annual revenue unlocked by EA */
  revenueUnlocked: number;
  /** Growth rate without EA (default 5%) */
  baseGrowthRate?: number;
  /** Additional growth rate with EA (default 15%) */
  eaGrowthRate?: number;
}

interface ChartDataPoint {
  month: string;
  current: number;
  withEA: number;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueChart({
  currentRevenue,
  revenueUnlocked,
  baseGrowthRate = 0.05,
  eaGrowthRate = 0.15,
}: RevenueChartProps) {
  // Generate 12-month projection data
  const chartData = React.useMemo<ChartDataPoint[]>(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyRevenue = currentRevenue / 12;
    const monthlyGrowth = baseGrowthRate / 12;
    const monthlyEAGrowth = eaGrowthRate / 12;

    return months.map((month, index) => {
      // Current trajectory: modest growth
      const currentGrowthFactor = 1 + (monthlyGrowth * index);
      const current = monthlyRevenue * currentGrowthFactor;

      // With EA: accelerated growth + time savings reinvested
      const eaGrowthFactor = 1 + (monthlyEAGrowth * index);
      const additionalMonthlyValue = (revenueUnlocked / 12) * (index / 12); // Ramp up
      const withEA = (monthlyRevenue * eaGrowthFactor) + additionalMonthlyValue;

      return {
        month,
        current: Math.round(current),
        withEA: Math.round(withEA),
      };
    });
  }, [currentRevenue, revenueUnlocked, baseGrowthRate, eaGrowthRate]);

  // Calculate the total difference at year end
  const yearEndDifference = chartData[11].withEA - chartData[11].current;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Revenue Projection</CardTitle>
        <CardDescription className="text-xs">
          12-month forecast with EA impact
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorWithEA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                interval={1}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickFormatter={formatCurrency}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  formatTooltipValue(value),
                  name === "withEA" ? "With EA" : "Current",
                ]}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#colorCurrent)"
                name="Current"
              />
              <Area
                type="monotone"
                dataKey="withEA"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#colorWithEA)"
                name="With EA"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-gray-400 rounded" />
            <span className="text-gray-500">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-600 rounded" />
            <span className="text-gray-500">With EA</span>
          </div>
        </div>

        {/* Year-end impact */}
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">Year-end impact</p>
          <p className="text-lg font-bold text-amber-600">
            +{formatTooltipValue(yearEndDifference)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
