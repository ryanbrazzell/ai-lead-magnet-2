/**
 * ROI Stats Component - Simple Math Equation Format
 *
 * Displays ROI as a clear, easy-to-understand math equation:
 * Hours freed × Hourly value = Revenue unlocked
 * - EA Investment
 * ─────────────────────────
 * = Net Return
 * (ROI Multiplier)
 */

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ROICalculation } from "@/lib/roi-calculator";

interface ROIStatsProps {
  roi: ROICalculation;
  firstName?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ROIStats({ roi, firstName = "there" }: ROIStatsProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Your ROI Breakdown
        </h3>

        {/* Math equation layout */}
        <div className="space-y-3">
          {/* Hours freed = Value */}
          <div className="flex items-center justify-between py-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{roi.weeklyHoursDelegated} hrs</span>/week freed up
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(roi.annualRevenueUnlocked)}
            </div>
          </div>

          {/* Minus EA Investment */}
          <div className="flex items-center justify-between py-2 text-gray-600">
            <div className="text-sm">
              <span className="text-red-500 font-medium">−</span> EA Investment
            </div>
            <div className="text-base font-medium text-red-500">
              {formatCurrency(roi.eaInvestment)}
            </div>
          </div>

          {/* Divider line */}
          <div className="border-t-2 border-gray-300" />

          {/* Net Return */}
          <div className="flex items-center justify-between py-2">
            <div className="text-sm font-semibold text-gray-900">
              Net Return
            </div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(roi.netReturn)}
            </div>
          </div>

          {/* ROI Multiplier badge */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <span className="text-sm text-gray-600">ROI Multiplier:</span>
              <span className="text-lg font-bold text-blue-600">
                {roi.roiMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
