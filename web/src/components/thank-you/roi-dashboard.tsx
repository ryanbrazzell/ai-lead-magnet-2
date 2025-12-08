/**
 * ROI Dashboard Component
 *
 * Simple single-column layout showing ROI stats in math equation format.
 */

"use client";

import * as React from "react";
import { ROIStats } from "./roi-stats";
import { calculateROI, type TaskHours } from "@/lib/roi-calculator";

interface ROIDashboardProps {
  taskHours: TaskHours;
  revenueRange: string;
  firstName?: string;
}

export function ROIDashboard({
  taskHours,
  revenueRange,
  firstName = "there",
}: ROIDashboardProps) {
  // Calculate ROI metrics
  const roi = React.useMemo(
    () => calculateROI(taskHours, revenueRange),
    [taskHours, revenueRange]
  );

  return (
    <section className="w-full">
      <ROIStats roi={roi} firstName={firstName} />
    </section>
  );
}
