"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroPainProps {
  firstName: string;
  onCTAClick?: () => void;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function HeroPain({ firstName, onCTAClick }: HeroPainProps) {
  const displayName = capitalizeFirst(firstName.trim());

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,var(--color-dark-bg),#2a2623)] px-5 pb-20 pt-16 text-center text-dark-text md:pt-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(232,244,243,0.72)]">
          Your time audit
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
          {displayName}, right now <span className="text-[var(--color-accent)]">you</span> are the{" "}
          <span className="text-[var(--color-accent)]">highest-paid assistant</span> at your company
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[rgba(250,250,247,0.74)]">
          Join <span className="font-semibold text-white">1,300+ founders</span> replacing 86+ hours of admin a month so they can focus on growth work again.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={onCTAClick} className="gap-2 rounded-full px-8">
            Book Your EA Delegation Roadmap Call
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
