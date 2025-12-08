/**
 * HeroEarnings Component
 * Big, attention-grabbing money number at the top of the results page
 * Shows the annual revenue they could unlock with an EA
 * Includes the Book Discovery Call CTA button
 */

"use client";

import * as React from "react";
import { TrendingUp, Clock, ArrowRight } from "lucide-react";
import { calculateROI, type TaskHours } from "@/lib/roi-calculator";

interface HeroEarningsProps {
  taskHours: TaskHours;
  revenueRange: string;
  firstName?: string;
  onBookCall?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function HeroEarnings({
  taskHours,
  revenueRange,
  firstName = "there",
  onBookCall,
}: HeroEarningsProps) {
  const roi = React.useMemo(
    () => calculateROI(taskHours, revenueRange),
    [taskHours, revenueRange]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 text-white">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="relative z-10">
        {/* Pre-headline */}
        <p className="text-blue-200 text-sm font-medium mb-2">
          {firstName}, you could be leaving money on the table...
        </p>

        {/* Main headline */}
        <h1 className="text-lg font-medium text-blue-100 mb-1">
          You Could Be Earning An Extra
        </h1>

        {/* The big number */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl md:text-5xl font-bold text-amber-400 drop-shadow-lg">
            {formatCurrency(roi.annualRevenueUnlocked)}
          </span>
          <span className="text-xl text-blue-200 font-medium">/year</span>
        </div>

        {/* Supporting stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-blue-200" />
            <span className="text-sm">
              <strong className="text-white">{roi.weeklyHoursDelegated}+ hrs</strong>
              <span className="text-blue-200">/week freed</span>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-sm">
              <strong className="text-amber-400">{roi.roiMultiplier.toFixed(1)}x</strong>
              <span className="text-blue-200"> ROI</span>
            </span>
          </div>
        </div>

        {/* Book Discovery Call CTA */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <button
            onClick={onBookCall}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Book Your Discovery Call
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
