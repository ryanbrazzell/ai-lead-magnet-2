"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { IClosedEmbed } from "@/components/ui/iclosed-embed";

function buildIClosedUrl({
  firstName,
  lastName,
  email,
  phone,
  revenue,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  revenue: string;
}) {
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
  const queryString = params.toString().replace(/\+/g, "%20");
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function BookCallContent() {
  const searchParams = useSearchParams();

  const firstName = searchParams.get("firstName") || searchParams.get("first_name") || "";
  const lastName = searchParams.get("lastName") || searchParams.get("last_name") || "";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const revenue = searchParams.get("revenue") || "";
  const leadId = searchParams.get("leadId") || "";

  React.useEffect(() => {
    if (leadId) localStorage.setItem("assistantlaunch_leadId", leadId);
    if (email) localStorage.setItem("assistantlaunch_email", email);
    if (phone) localStorage.setItem("assistantlaunch_phone", phone);
  }, [leadId, email, phone]);

  React.useEffect(() => {
    const origScrollTo = window.scrollTo;
    const origScroll = window.scroll;

    window.scrollTo = function () {} as typeof window.scrollTo;
    window.scroll = function () {} as typeof window.scroll;

    const timeoutId = setTimeout(() => {
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
    };
  }, []);

  const iClosedUrl = buildIClosedUrl({
    firstName,
    lastName,
    email,
    phone,
    revenue,
  });

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

      <section className="bg-[linear-gradient(180deg,var(--color-dark-bg),#2a2623)] px-5 py-16 text-center text-dark-text">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(232,244,243,0.7)]">
            Strategy call
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            It&apos;s Time to Buy Back Your Time
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[rgba(250,250,247,0.74)]">
            Schedule your EA Delegation Roadmap Call and we&apos;ll show you the fastest path out of the weeds.
          </p>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <IClosedEmbed
            dataUrl={iClosedUrl}
            eyebrow="What we'll cover"
            heading="Book Your EA Delegation Roadmap Call"
            body="In under 30 minutes, we'll show you how top-performing founders and executives are operating differently."
            bulletItems={[
              "Your top 5 tasks to delegate immediately",
              "Which EA profile matches your business",
              "Your 30-day delegation map to get you performing at the highest level",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
