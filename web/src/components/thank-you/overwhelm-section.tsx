"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const checklistItems = [
  'Keeping a constant "email to-do" list',
  "Scheduling and rescheduling meetings",
  "Fielding every decision and request yourself",
  "Building decks and presentations yourself",
  "Carrying open loops in your head constantly",
  "Booking your own flights and hotels",
  "Following up on things you delegate",
  "Checking email nights and weekends",
  "Staying glued to Slack or WhatsApp answering questions",
  "Handling personal tasks and appointments",
  "Letting opportunities slip because you're buried",
  "Working through vacations because no one else can cover",
];

function getEfficiencyColor(checked: number): string {
  if (checked >= 8) return "var(--color-error)";
  if (checked >= 4) return "var(--color-warning)";
  return "var(--color-accent)";
}

function getEfficiencyLabel(checked: number): string {
  if (checked >= 10) return "Critical";
  if (checked >= 8) return "Overloaded";
  if (checked >= 5) return "Stretched";
  if (checked >= 3) return "Warning";
  return "Healthy";
}

interface OverwhelmSectionProps {
  onCTAClick?: () => void;
}

export function OverwhelmSection({ onCTAClick }: OverwhelmSectionProps) {
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());
  const checkedCount = checkedItems.size;
  const efficiencyPercent = Math.round((checkedCount / checklistItems.length) * 100);

  return (
    <section className="bg-white px-5 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Reality check
          </p>
          <h2 className="mb-4 text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
            Read this job description. Sound familiar?
          </h2>
          <p className="mb-6 max-w-2xl text-base leading-relaxed text-[color:var(--color-secondary)]">
            Put a check next to every task you&apos;re still doing yourself, and we&apos;ll show you your CEO efficiency rate.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {checklistItems.map((item, index) => {
              const isChecked = checkedItems.has(index);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCheckedItems((prev) => {
                      const next = new Set(prev);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    })
                  }
                  className="flex items-start gap-3 rounded-[18px] border border-border bg-[var(--color-surface)] px-4 py-4 text-left transition-colors hover:border-[var(--color-accent)]"
                  style={{
                    backgroundColor: isChecked ? "var(--color-accent-light)" : undefined,
                  }}
                >
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border text-xs font-semibold"
                    style={{
                      borderColor: isChecked ? "var(--color-accent)" : "var(--color-border)",
                      backgroundColor: isChecked ? "var(--color-accent)" : "transparent",
                      color: isChecked ? "white" : "transparent",
                    }}
                  >
                    v
                  </span>
                  <span className="text-sm leading-relaxed text-primary">{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-[var(--color-surface)] p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            CEO efficiency rate
          </p>
          <div className="mt-6 flex items-center gap-5">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full border-[10px]"
              style={{ borderColor: getEfficiencyColor(checkedCount) }}
            >
              <span className="font-serif text-3xl text-primary">{efficiencyPercent}%</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {getEfficiencyLabel(checkedCount)}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[color:var(--color-secondary)]">
                The more of these you still own, the more your highest-value hours are getting eaten by coordination work.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[22px] border border-dark-border bg-primary p-6 text-dark-text">
            <p className="text-sm uppercase tracking-[0.14em] text-[rgba(250,250,247,0.65)]">
              The target
            </p>
            <p className="mt-3 text-2xl font-semibold">
              Our clients work toward checking zero.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(250,250,247,0.78)]">
              Not because they do less, but because their EA owns the coordination, follow-through, and recurring admin that used to keep them in the weeds.
            </p>
            {onCTAClick && (
              <div className="mt-6">
                <Button onClick={onCTAClick} className="rounded-full px-8">
                  Book Your EA Delegation Roadmap Call
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
