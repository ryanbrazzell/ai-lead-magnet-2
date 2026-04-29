"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { calculateROI, type TaskHours } from "@/lib/roi-calculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CostCardProps {
  taskHours: TaskHours;
  revenueRange: string;
  onCTAClick?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CostCard({ taskHours, revenueRange, onCTAClick }: CostCardProps) {
  const roi = calculateROI(taskHours, revenueRange);
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);

  const [animatedNetReturn, setAnimatedNetReturn] = React.useState(0);
  const [animatedROI, setAnimatedROI] = React.useState(0);

  React.useEffect(() => {
    const duration = 10000;
    const startTime = Date.now();

    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setAnimatedNetReturn(Math.round(easedProgress * roi.netReturn));
      setAnimatedROI(easedProgress * roi.roiMultiplier);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [roi.netReturn, roi.roiMultiplier]);

  return (
    <section className="-mt-10 px-5 pb-12 md:-mt-14">
      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden rounded-[28px] shadow-[0_28px_70px_rgba(26,24,22,0.12)]">
          <CardContent className="grid gap-0 p-0 md:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-border p-6 md:border-b-0 md:border-r md:p-10">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Based on your answers
              </p>
              <h2 className="mb-6 text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
                You still owning admin is costing you:
              </h2>

              <div className="rounded-[24px] border border-border bg-[var(--color-surface)] p-5 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                    <span className="text-sm text-[color:var(--color-secondary)]">
                      Your effective hourly rate
                    </span>
                    <span className="font-serif text-3xl text-primary">
                      {formatCurrency(roi.ceoHourlyRate)}/hr
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                    <span className="text-sm text-[color:var(--color-secondary)]">
                      Hours wasted per week
                    </span>
                    <span className="font-serif text-3xl text-[var(--color-warning)]">
                      {totalWeeklyHours}+ hrs
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
                    <span className="text-sm text-[color:var(--color-secondary)]">
                      Weeks per year
                    </span>
                    <span className="font-serif text-3xl text-primary">52</span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-semibold text-primary">
                      You&apos;re losing per year
                    </span>
                    <span className="font-serif text-4xl text-[var(--color-error)] md:text-5xl">
                      {formatCurrency(roi.annualRevenueUnlocked)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-primary p-6 text-dark-text md:p-10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(232,244,243,0.72)]">
                  If you had an assistant
                </p>
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-6">
                  <p className="text-sm uppercase tracking-[0.12em] text-[rgba(250,250,247,0.74)]">
                    Net return
                  </p>
                  <p className="mt-3 font-serif text-5xl text-[var(--color-accent)]">
                    +{formatCurrency(animatedNetReturn)}
                  </p>
                  <p className="mt-3 text-base text-[rgba(250,250,247,0.78)]">
                    That&apos;s a {animatedROI.toFixed(1)}x ROI this year.
                  </p>
                </div>
              </div>

              {onCTAClick && (
                <div className="mt-8">
                  <Button
                    size="lg"
                    onClick={onCTAClick}
                    className="w-full gap-2 rounded-full md:w-auto"
                  >
                    Book Your EA Delegation Roadmap Call
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
