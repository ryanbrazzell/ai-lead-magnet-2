import React from "react";

export interface HeroSectionProps {
  headline: React.ReactNode;
  subheadline?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export function HeroSection({
  headline,
  subheadline,
  imageSrc,
  imageAlt = "Product mockup",
}: HeroSectionProps) {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-2 md:py-6"
      aria-label="Hero section"
    >
      <div
        data-testid="hero-layout"
        className="grid items-center gap-8 rounded-[28px] border border-border bg-white/80 p-6 shadow-[0_20px_60px_rgba(26,24,22,0.06)] md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:p-10"
      >
        <div className="w-full text-center md:text-left">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            Time Freedom Report
          </p>
          <h1 data-testid="hero-headline" className="text-hero text-foreground">
            {headline}
          </h1>

          {subheadline && (
            <p
              data-testid="hero-subheadline"
              className="mt-4 text-base leading-relaxed text-[color:var(--color-secondary)] md:text-lg"
            >
              {subheadline}
            </p>
          )}
        </div>

        {imageSrc ? (
          <div className="flex w-full justify-center">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="block h-auto w-full max-w-[460px] object-contain drop-shadow-[0_20px_40px_rgba(43,122,120,0.18)]"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            data-testid="hero-image-placeholder"
            className="hidden min-h-[220px] rounded-[24px] border border-dashed border-border bg-[linear-gradient(135deg,rgba(43,122,120,0.08),rgba(240,238,234,0.9))] md:block"
          />
        )}
      </div>
    </section>
  );
}
