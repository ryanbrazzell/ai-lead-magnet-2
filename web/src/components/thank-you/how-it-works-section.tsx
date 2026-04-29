"use client";

import { Badge } from "@/components/ui/badge";

interface HowItWorksSectionProps {
  onCTAClick?: () => void;
}

const painPoints = [
  "You're still doing everything yourself because no one does it like you.",
  "Every time you delegate, you end up redoing it anyway.",
  "You can't step away without something falling apart.",
  "Random fires keep pulling you back into the weeds.",
  "You don't trust anyone to actually own something in your business.",
];

const steps = [
  {
    number: "1",
    title: "The Right Person",
    body: "Our EAs are trained to think like operators, not task rabbits. They anticipate, prioritize, and follow through.",
  },
  {
    number: "2",
    title: "The Right System",
    body: "Daily syncs, clear ownership zones, and structured handoffs replace the constant back-and-forth that burns founders out.",
  },
  {
    number: "3",
    title: "The Right Support",
    body: "You are not left alone to figure it out. Our client success team keeps the relationship healthy and expanding.",
  },
];

export function HowItWorksSection({}: HowItWorksSectionProps) {
  return (
    <section className="bg-[var(--color-surface)] px-5 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Why assistants fail
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
            Maybe you&apos;ve tried to hire an assistant on your own before
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {painPoints.map((point) => (
            <div key={point} className="rounded-[18px] border border-border bg-white px-5 py-4 text-sm leading-relaxed text-primary shadow-sm">
              {point}
            </div>
          ))}
        </div>

        <div className="rounded-[30px] border border-border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 text-center">
            <Badge className="mb-4">Executive Assistants Done the Right Way</Badge>
            <h3 className="text-3xl font-semibold tracking-[-0.03em] text-primary">
              The system behind our 1,300+ founder placements
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-[24px] border border-border bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-serif text-xl text-[var(--color-accent)]">
                  {step.number}
                </div>
                <h4 className="text-xl font-semibold text-primary">{step.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-secondary)]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
