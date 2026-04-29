"use client";

import * as React from "react";
import { Brain, ChartBar, CheckCircle, Sparkles } from "lucide-react";

interface AnalyzingAnimationProps {
  firstName?: string;
  onComplete: () => void;
  duration?: number;
}

const stages = [
  { icon: Brain, text: "Reading through your responses..." },
  { icon: ChartBar, text: "Pulling context from your website..." },
  { icon: Sparkles, text: "Mapping the recurring work in your business..." },
  { icon: Brain, text: "Identifying delegation opportunities..." },
  { icon: ChartBar, text: "Calibrating to your revenue stage..." },
  { icon: Sparkles, text: "Writing your personalized roadmap..." },
  { icon: CheckCircle, text: "Putting the final report together..." },
];

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function AnalyzingAnimation({
  firstName = "there",
  onComplete,
  duration = 15000,
}: AnalyzingAnimationProps) {
  const displayName = capitalizeFirst(firstName);
  const [currentStage, setCurrentStage] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const stageInterval = duration / stages.length;
    const progressInterval = 50;
    const fastStep = 95 / (duration / progressInterval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) return Math.min(prev + fastStep, 95);
        return Math.min(prev + 0.02, 99);
      });
    }, progressInterval);

    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, stageInterval);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stageTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  const CurrentIcon = stages[currentStage].icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(43,122,120,0.12),transparent_28%),var(--color-bg)] px-5">
      <div className="w-full max-w-2xl rounded-[32px] border border-border bg-white/90 p-8 text-center shadow-[0_28px_80px_rgba(26,24,22,0.08)] md:p-12">
        <div className="relative mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-[var(--color-accent)] shadow-[0_20px_40px_rgba(26,24,22,0.18)]">
            <CurrentIcon className="h-11 w-11 animate-pulse" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 animate-[spin_6s_linear_infinite] rounded-full border border-[rgba(43,122,120,0.25)] border-t-[var(--color-accent)]" />
          </div>
        </div>

        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Building your report
        </p>
        <h2 className="mb-3 text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
          {displayName}, hold tight...
        </h2>
        <p className="mb-6 text-lg text-[color:var(--color-secondary)]">
          {stages[currentStage].text}
        </p>

        <div className="mx-auto max-w-md">
          <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),#4aa3a0)] transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-[color:var(--color-secondary)]">
            {Math.round(progress)}% complete
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {stages.map((_, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{
                backgroundColor:
                  index <= currentStage ? "var(--color-accent)" : "var(--color-border)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
