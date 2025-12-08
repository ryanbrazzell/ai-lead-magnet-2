/**
 * ROI Components
 *
 * Split into two components for flexible layout:
 * - RevenueHero: The big headline with revenue amount
 * - ROIAnalysis: Cost-benefit breakdown with challenge question
 */

"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, DollarSign, Calculator } from 'lucide-react';
import { calculateROI, formatCurrency, formatMultiplier, type TaskHours } from '@/lib/roi-calculator';

interface ROIProps {
  taskHours: TaskHours;
  revenueRange: string;
  firstName?: string;
}

/**
 * Revenue Hero - The big headline section
 */
export function RevenueHero({ taskHours, revenueRange, firstName = 'there' }: ROIProps) {
  const roi = calculateROI(taskHours, revenueRange);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white text-center"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
        <TrendingUp className="w-4 h-4" />
        Revenue Potential Unlocked
      </div>

      <h2 className="text-3xl md:text-4xl font-bold mb-2">
        {firstName}, You Could Unlock
      </h2>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-5xl md:text-6xl font-black my-4"
      >
        {formatCurrency(roi.annualRevenueUnlocked)}
      </motion.div>

      <p className="text-lg text-white/80 mb-6">
        annually by delegating just {roi.weeklyHoursDelegated} hours per week
      </p>

      {/* Calculation Flow */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/90">
        <span className="bg-white/10 px-3 py-1 rounded-full">
          {roi.weeklyHoursDelegated} hrs/week
        </span>
        <ArrowRight className="w-4 h-4" />
        <span className="bg-white/10 px-3 py-1 rounded-full">
          {roi.monthlyHoursUnlocked} hrs/month
        </span>
        <ArrowRight className="w-4 h-4" />
        <span className="bg-white/10 px-3 py-1 rounded-full">
          {formatCurrency(roi.ceoHourlyRate)}/hr activities
        </span>
      </div>
    </motion.div>
  );
}

/**
 * ROI Analysis - Cost-benefit breakdown with challenge question
 */
export function ROIAnalysis({ taskHours, revenueRange }: ROIProps) {
  const roi = calculateROI(taskHours, revenueRange);

  return (
    <div className="space-y-6">
      {/* ROI Cost-Benefit Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">ROI Analysis</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Revenue Unlocked Line */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Annual Revenue Unlocked</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              +{formatCurrency(roi.annualRevenueUnlocked)}
            </span>
          </div>

          {/* EA Investment Line */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-700">EA Investment (annual)</span>
            </div>
            <span className="text-lg font-bold text-gray-600">
              -{formatCurrency(roi.eaInvestment)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-gray-300 my-2" />

          {/* Net Return */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-bold text-gray-900">NET RETURN</span>
            </div>
            <span className="text-2xl font-black text-purple-600">
              {formatCurrency(roi.netReturn)}
            </span>
          </div>

          {/* ROI Multiplier */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">ROI MULTIPLIER</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-4xl font-black text-purple-700"
            >
              {formatMultiplier(roi.roiMultiplier)}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Challenge Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center"
      >
        <p className="text-xl md:text-2xl font-bold text-gray-900">
          What other investments are giving you a{' '}
          <span className="text-purple-600">{formatMultiplier(roi.roiMultiplier)}</span>
          {' '}return right now?
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Combined ROI Breakdown (for backwards compatibility)
 */
export function ROIBreakdown({ taskHours, revenueRange, firstName = 'there' }: ROIProps) {
  return (
    <div className="space-y-8">
      <RevenueHero taskHours={taskHours} revenueRange={revenueRange} firstName={firstName} />
      <ROIAnalysis taskHours={taskHours} revenueRange={revenueRange} />
    </div>
  );
}
