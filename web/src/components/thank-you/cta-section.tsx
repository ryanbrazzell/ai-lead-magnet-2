"use client";

import * as React from "react";
import { IClosedEmbed } from "@/components/ui/iclosed-embed";

interface CTASectionProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  painPoints?: string;
  leadId?: string;
  meta_fbc?: string;
  meta_fbp?: string;
  revenue?: string;
}

function buildIClosedUrl({
  firstName,
  lastName,
  email,
  phone,
  painPoints,
  meta_fbc,
  meta_fbp,
  revenue,
}: Required<Pick<CTASectionProps, "firstName" | "lastName" | "email" | "phone" | "painPoints" | "meta_fbc" | "meta_fbp" | "revenue">>) {
  const isTriageCall = revenue === "Under $500k";
  const baseUrl = isTriageCall
    ? "https://app.iclosed.io/e/assistantlaunch/intro-call"
    : "https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet";
  const params = new URLSearchParams();

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (fullName) params.set("iclosedName", fullName);
  if (email) params.set("iclosedEmail", email);

  if (phone) {
    const phoneDigits = phone.replace(/\D/g, "");
    let formattedPhone: string;
    if (phoneDigits.length === 10) {
      formattedPhone = `+1${phoneDigits}`;
    } else if (phoneDigits.startsWith("1") && phoneDigits.length === 11) {
      formattedPhone = `+${phoneDigits}`;
    } else {
      formattedPhone = phone.startsWith("+") ? phone : `+${phoneDigits}`;
    }
    params.set("iclosedPhone", formattedPhone);
  }

  params.set("timeFormat", "12h");
  if (painPoints) params.set("pain", painPoints);
  if (meta_fbc) params.set("fbc", meta_fbc);
  if (meta_fbp) params.set("fbp", meta_fbp);

  const queryString = params.toString().replace(/\+/g, "%20");
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function CTASection({
  firstName = "",
  lastName = "",
  email = "",
  phone = "",
  painPoints = "",
  leadId = "",
  meta_fbc = "",
  meta_fbp = "",
  revenue = "",
}: CTASectionProps) {
  React.useEffect(() => {
    const origScrollIntoView = Element.prototype.scrollIntoView;
    const origScrollTo = window.scrollTo;
    const origScroll = window.scroll;
    const origFocus = HTMLElement.prototype.focus;

    Element.prototype.scrollIntoView = function (...args: Parameters<typeof origScrollIntoView>) {
      const widgetContainer = document.getElementById("calendar-section");
      if (widgetContainer && widgetContainer.contains(this)) {
        return;
      }
      return origScrollIntoView.apply(this, args);
    };

    window.scrollTo = function () {} as typeof window.scrollTo;
    window.scroll = function () {} as typeof window.scroll;

    HTMLElement.prototype.focus = function (options?: FocusOptions) {
      const widgetContainer = document.getElementById("calendar-section");
      if (widgetContainer && widgetContainer.contains(this)) {
        return origFocus.call(this, { ...options, preventScroll: true });
      }
      return origFocus.call(this, options);
    };

    const timeoutId = setTimeout(() => {
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
    };
  }, []);

  React.useEffect(() => {
    if (leadId) localStorage.setItem("assistantlaunch_leadId", leadId);
    if (email) localStorage.setItem("assistantlaunch_email", email);
    if (phone) localStorage.setItem("assistantlaunch_phone", phone);
    if (meta_fbc) localStorage.setItem("assistantlaunch_fbc", meta_fbc);
    if (meta_fbp) localStorage.setItem("assistantlaunch_fbp", meta_fbp);
  }, [leadId, email, phone, meta_fbc, meta_fbp]);

  const iClosedUrl = buildIClosedUrl({
    firstName,
    lastName,
    email,
    phone,
    painPoints,
    meta_fbc,
    meta_fbp,
    revenue,
  });

  return (
    <section id="schedule-call-section" className="border-t border-border bg-[var(--color-bg)] px-5 py-16 text-center">
      <div className="mx-auto max-w-5xl">
        <IClosedEmbed
          dataUrl={iClosedUrl}
          eyebrow="Strategy call"
          heading={
            <>
              Ready to focus only your <span className="text-[var(--color-accent)]">zone of genius</span>?
            </>
          }
          body="In under 30 minutes, we'll show you how top-performing founders and executives are operating differently and what your first delegation moves should be."
          bulletItems={[
            "Your top 5 tasks to delegate immediately",
            "Which EA profile matches your business",
            "Your 30-day delegation map to get you performing at the highest level",
          ]}
        />
      </div>
    </section>
  );
}
