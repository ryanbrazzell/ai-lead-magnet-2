"use client";

import * as React from "react";
import { Instagram, Mail, MessageSquare, TriangleAlert } from "lucide-react";
import { Footer } from "@/components/layout/footer";

interface ConfirmationShellProps {
  firstName?: string;
  email?: string;
  phone?: string;
  title: string;
}

const steps = [
  {
    title: "Check your inbox",
    description: "Look for the calendar invite from Assistant Launch or Google Calendar.",
  },
  {
    title: "Find the event invite",
    description: "Open the event details and make sure the meeting shows on your calendar.",
  },
  {
    title: "Accept the invitation",
    description: "If you skip this step, your spot can still be released.",
  },
];

export function ConfirmationShell({
  firstName,
  email,
  phone,
  title,
}: ConfirmationShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="border-b border-dark-border bg-primary px-5 py-4 text-center">
        <a
          href="https://www.assistantlaunch.com"
          className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[var(--color-accent)]"
        >
          Assistant Launch
        </a>
      </div>

      <div className="bg-[linear-gradient(90deg,#7f1d1d,#991b1b)] px-5 py-3 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-center text-sm font-semibold">
          <TriangleAlert className="h-4 w-4 text-amber-300" />
          Your call is NOT confirmed yet!
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
              One more step
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
              {firstName ? `${firstName}, ` : ""}
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-secondary)]">
              Accept the calendar invite or your spot may be given away.
            </p>

            <div className="mt-8 rounded-[24px] border border-border bg-[var(--color-surface)] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                Confirm in 3 steps
              </p>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-sm text-[var(--color-accent)]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/check-email-demo.gif"
                alt="How to accept your calendar invite"
                className="h-auto w-full"
              />
            </div>

            <div className="rounded-[28px] border border-dark-border bg-primary p-6 text-dark-text shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-accent-light)]">
                  <Mail className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[rgba(250,250,247,0.68)]">
                    Invite destination
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {email || "Check the email address you booked with"}
                  </p>
                  {phone && (
                    <p className="mt-2 text-sm text-[rgba(250,250,247,0.72)]">
                      Booking phone: {phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-2xl px-5 pb-12 text-center">
        <p className="mb-6 text-base text-[color:var(--color-secondary)]">
          Having trouble? Reach out:
        </p>
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://instagram.com/ryanbrazzell"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] px-6 font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            <Instagram className="h-5 w-5" />
            DM Ryan on Instagram
          </a>
          <a
            href="sms:+14424163020"
            className="inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-md border border-border bg-white px-6 font-medium text-primary transition-colors hover:bg-[var(--color-surface)]"
          >
            <MessageSquare className="h-5 w-5 text-[var(--color-accent)]" />
            Text (442) 416-3020
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
