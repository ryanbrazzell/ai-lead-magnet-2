"use client";

import * as React from "react";
import Script from "next/script";
import { Card, CardContent } from "@/components/ui/card";

interface IClosedEmbedProps {
  dataUrl: string;
  title?: string;
  id?: string;
  height?: number;
  eyebrow?: string;
  heading?: React.ReactNode;
  body?: React.ReactNode;
  bulletItems?: string[];
}

export function IClosedEmbed({
  dataUrl,
  title = "Schedule a call - Executive Assistant Discovery",
  id = "calendar-section",
  height = 620,
  eyebrow,
  heading,
  body,
  bulletItems = [],
}: IClosedEmbedProps) {
  return (
    <div className="space-y-6">
      {(eyebrow || heading || body || bulletItems.length > 0) && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-4 p-6">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {eyebrow}
              </p>
            )}
            {heading && <h3 className="font-serif text-3xl font-semibold text-primary">{heading}</h3>}
            {body && <p className="leading-relaxed text-[color:var(--color-secondary)]">{body}</p>}
            {bulletItems.length > 0 && (
              <ul className="grid gap-3 text-left">
                {bulletItems.map((item) => (
                  <li key={item} className="flex gap-3 rounded-[14px] bg-[var(--color-surface)] px-4 py-3 text-sm text-primary">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
                      OK
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div
        id={id}
        className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_24px_60px_rgba(26,24,22,0.08)]"
        style={{ minHeight: `${height}px` }}
      >
        <div
          className="iclosed-widget"
          data-url={dataUrl}
          title={title}
          style={{ width: "100%", height: `${height}px` }}
        />
        <Script src="https://app.iclosed.io/assets/widget.js" strategy="afterInteractive" />
      </div>
    </div>
  );
}
