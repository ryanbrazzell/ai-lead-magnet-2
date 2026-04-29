import { Calculator, ClipboardCheck, FileText, Users } from "lucide-react";

const bonuses = [
  {
    icon: FileText,
    title: "10 Things to Delegate",
    subtitle: "Save 10+ hours/week",
  },
  {
    icon: Calculator,
    title: "Buy Back Your Time Calculator",
    subtitle: "Know your ROI instantly",
  },
  {
    icon: ClipboardCheck,
    title: "EA Daily Checklist SOP",
    subtitle: "Hit the ground running",
  },
  {
    icon: Users,
    title: "15 EA Interview Questions",
    subtitle: "Hire your dream EA",
  },
];

export function BonusStack() {
  return (
    <section className="mx-auto w-full max-w-form px-4 py-6">
      <div className="rounded-[24px] border border-border bg-[var(--color-surface)] p-5 md:p-6">
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          Plus 4 free bonuses
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bonuses.map((bonus) => (
            <div
              key={bonus.title}
              className="flex items-start gap-3 rounded-[18px] border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-accent-light)]">
                <bonus.icon className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{bonus.title}</p>
                <p className="text-xs leading-relaxed text-[color:var(--color-secondary)]">
                  {bonus.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
