"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getTaskHoursByRevenue, type TaskHours } from "@/lib/roi-calculator";
import { AnalyzingAnimation } from "./analyzing-animation";
import { CTASection } from "./cta-section";
import { CostCard } from "./cost-card";
import { FAQSection } from "./faq-section";
import { FinalCTASection } from "./final-cta-section";
import { HeroPain } from "./hero-pain";
import { HowItWorksSection } from "./how-it-works-section";
import { OverwhelmSection } from "./overwhelm-section";
import { SocialProofSection } from "./social-proof-section";

interface FormDataFromURL {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  revenue: string;
  painPoints: string;
  leadId: string;
  taskHours?: TaskHours;
  meta_fbc?: string;
  meta_fbp?: string;
}

function decodeFormData(encodedData: string): FormDataFromURL | null {
  try {
    const jsonString = decodeURIComponent(
      Array.from(atob(encodedData), (c) =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join("")
    );
    return JSON.parse(jsonString) as FormDataFromURL;
  } catch {
    try {
      const decoded = atob(encodedData);
      return JSON.parse(decoded) as FormDataFromURL;
    } catch {
      console.error("Failed to decode form data from URL");
      return null;
    }
  }
}

export function ThankYouContent() {
  const searchParams = useSearchParams();
  const [showAnalyzing, setShowAnalyzing] = React.useState(true);
  const [showEmailToast, setShowEmailToast] = React.useState(true);

  const formData = React.useMemo<FormDataFromURL | null>(() => {
    const encodedData = searchParams.get("data");
    if (!encodedData) {
      const email = searchParams.get("email") || "";
      if (!email) return null;
      return {
        firstName: searchParams.get("firstName") || "",
        lastName: searchParams.get("lastName") || "",
        email,
        phone: searchParams.get("phone") || "",
        revenue: searchParams.get("revenue") || "",
        painPoints: searchParams.get("painPoints") || "",
        leadId: searchParams.get("leadId") || "",
      };
    }

    return decodeFormData(encodedData);
  }, [searchParams]);

  const revenueRange = formData?.revenue || "$500k-$1M";
  const taskHours: TaskHours = formData?.taskHours ?? getTaskHoursByRevenue(revenueRange);
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  const annualHours = totalWeeklyHours * 52;
  const handleCTAClick = React.useCallback(() => {
    setTimeout(() => {
      document
        .getElementById("schedule-call-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  React.useEffect(() => {
    if (!showAnalyzing && showEmailToast) {
      const timer = setTimeout(() => setShowEmailToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showAnalyzing, showEmailToast]);

  if (showAnalyzing) {
    return (
      <AnalyzingAnimation
        firstName={formData?.firstName || "there"}
        onComplete={() => setShowAnalyzing(false)}
        duration={8000}
      />
    );
  }

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

      <HeroPain firstName={formData?.firstName || "there"} onCTAClick={handleCTAClick} />
      <CostCard taskHours={taskHours} revenueRange={revenueRange} onCTAClick={handleCTAClick} />
      <OverwhelmSection onCTAClick={handleCTAClick} />
      <HowItWorksSection onCTAClick={handleCTAClick} />
      <CTASection
        firstName={formData?.firstName || ""}
        lastName={formData?.lastName || ""}
        email={formData?.email || ""}
        phone={formData?.phone || ""}
        painPoints={formData?.painPoints || ""}
        leadId={formData?.leadId || ""}
        meta_fbc={formData?.meta_fbc || ""}
        meta_fbp={formData?.meta_fbp || ""}
        revenue={revenueRange}
      />
      <SocialProofSection onCTAClick={handleCTAClick} />
      <FAQSection />
      <FinalCTASection annualHours={annualHours} onButtonClick={handleCTAClick} />

      {showEmailToast && formData?.email && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-[20px] border border-border bg-white p-4 shadow-[0_20px_50px_rgba(26,24,22,0.12)]">
          <button
            type="button"
            onClick={() => setShowEmailToast(false)}
            className="absolute right-3 top-3 rounded-full p-1 text-[color:var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="pr-6 text-sm leading-relaxed text-[color:var(--color-secondary)]">
            Your personalized report is being written and will arrive at{" "}
            <span className="font-semibold text-primary">{formData.email}</span> in 2-3 minutes.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <div className="h-full animate-[shrink_8s_linear_forwards] rounded-full bg-[var(--color-accent)]" />
          </div>
        </div>
      )}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
