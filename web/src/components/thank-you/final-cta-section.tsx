"use client";

import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinalCTASectionProps {
  annualHours: number;
  onButtonClick?: () => void;
}

export function FinalCTASection({
  annualHours,
  onButtonClick,
}: FinalCTASectionProps) {
  const handleClick = () => {
    if (onButtonClick) onButtonClick();
    else {
      document
        .getElementById("schedule-call-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="bg-[linear-gradient(180deg,var(--color-dark-bg),#2a2623)] px-5 py-20 text-center text-dark-text">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
          You&apos;ve seen the cost. {annualHours}+ hours per year. Now let&apos;s fix it.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[rgba(250,250,247,0.74)]">
          Schedule your call and we&apos;ll walk you through the exact delegation system that frees up your calendar for growth work.
        </p>
        <div className="mt-8">
          <Button size="lg" onClick={handleClick} className="gap-2 rounded-full px-8">
            Book Your EA Delegation Roadmap Call
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl items-start gap-4 rounded-[24px] border border-white/10 bg-white/8 p-5 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-accent-light)]">
            <Mail className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <strong className="block text-sm text-white">Don&apos;t forget to check your inbox</strong>
            <span className="mt-1 block text-sm leading-relaxed text-[rgba(250,250,247,0.72)]">
              Your full Time Freedom Report has the complete breakdown and will arrive separately.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
