/**
 * ThankYouContent Component
 * Main report page composition
 *
 * Page reveals after 8s analyzing animation. Report generation is handled
 * server-side via /api/generate-report (fired from form submit).
 * This page is display-only — it focuses the user on booking the strategy call.
 *
 * Sections in order:
 * 1. Navigation Header (navy bar with logo)
 * 2. Hero Pain (navy, "highest-paid assistant", booking CTA)
 * 3. Cost Card (time lost + ROI breakdown)
 * 4. How It Works (Right Person, Right Process, Right Support)
 * 5. CTA Section with Calendar (iClosed widget)
 * 6. Social Proof (testimonials)
 * 7. FAQ
 * 8. Final CTA
 * + Floating toast: "Your personalized report is being written and will arrive at {email} in 2-3 minutes"
 */

"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { HeroPain } from './hero-pain';
import { CostCard } from './cost-card';
import { CTASection } from './cta-section';
import { SocialProofSection } from './social-proof-section';
import { FAQSection } from './faq-section';
import { FinalCTASection } from './final-cta-section';
import { HowItWorksSection } from './how-it-works-section';
import { OverwhelmSection } from './overwhelm-section';
import { AnalyzingAnimation } from './analyzing-animation';
import { ConfirmationBanner } from './confirmation-banner';
import { VideoSection } from './video-section';
import { calculateROI, getTaskHoursByRevenue, type TaskHours } from '@/lib/roi-calculator';
import { readVariationParam, getReportVideoUrl } from '@/lib/ab-test/variation';

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

export function ThankYouContent() {
  const searchParams = useSearchParams();

  const [showAnalyzing, setShowAnalyzing] = React.useState(true);
  const [showEmailToast, setShowEmailToast] = React.useState(true);

  // Parse form data from URL params (base64 encoded with Unicode-safe decoding)
  const formData = React.useMemo<FormDataFromURL | null>(() => {
    const encodedData = searchParams.get('data');
    if (!encodedData) {
      const firstName = searchParams.get('firstName') || '';
      const lastName = searchParams.get('lastName') || '';
      const email = searchParams.get('email') || '';

      if (email) {
        return {
          firstName,
          lastName,
          email,
          phone: searchParams.get('phone') || '',
          revenue: searchParams.get('revenue') || '',
          painPoints: searchParams.get('painPoints') || '',
          leadId: searchParams.get('leadId') || '',
        };
      }
      return null;
    }

    try {
      // Unicode-safe base64 decoding (reverse of the encodeURIComponent + btoa pattern)
      const jsonString = decodeURIComponent(
        Array.from(atob(encodedData), (c) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      return JSON.parse(jsonString) as FormDataFromURL;
    } catch {
      // Fallback: try plain atob for backward compatibility with old-format URLs
      try {
        const decoded = atob(encodedData);
        return JSON.parse(decoded) as FormDataFromURL;
      } catch {
        console.error('Failed to decode form data from URL');
        return null;
      }
    }
  }, [searchParams]);

  // Default revenue range
  const revenueRange = formData?.revenue || '$500k-$1M';

  // Get task hours based on revenue tier (or use provided taskHours)
  const taskHours: TaskHours = formData?.taskHours ?? getTaskHoursByRevenue(revenueRange);

  // Calculate ROI based on revenue
  const roi = React.useMemo(
    () => calculateROI(taskHours, revenueRange),
    [taskHours, revenueRange]
  );

  // Calculate annual hours for display
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  const annualHours = totalWeeklyHours * 52;

  // Handle CTA button clicks to scroll to calendar section container
  const handleCTAClick = React.useCallback(() => {
    setTimeout(() => {
      document.getElementById('schedule-call-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const variation = readVariationParam(searchParams);
  const reportVideoUrl = getReportVideoUrl();

  // Auto-dismiss email toast after page reveals
  React.useEffect(() => {
    if (!showAnalyzing && showEmailToast) {
      const timer = setTimeout(() => setShowEmailToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showAnalyzing, showEmailToast]);

  // Animation done = page reveals (report generates independently in background)
  const handleAnimationComplete = React.useCallback(() => {
    setShowAnalyzing(false);
  }, []);

  // Show analyzing animation for 8 seconds (report generates in background)
  if (showAnalyzing) {
    return (
      <AnalyzingAnimation
        firstName={formData?.firstName || 'there'}
        onComplete={handleAnimationComplete}
        duration={8000}
      />
    );
  }

  const navHeader = (
    <div
      key="nav"
      style={{
        background: '#0f172a',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <a href="https://www.assistantlaunch.com" style={{ textDecoration: 'none', display: 'inline-block' }}>
        <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '24px', color: '#f59e0b' }}>
          Assistant Launch &#128640;
        </span>
      </a>
    </div>
  );

  const heroPain = <HeroPain key="hero" firstName={formData?.firstName || 'there'} onCTAClick={handleCTAClick} />;
  const costCard = (
    <CostCard key="cost" taskHours={taskHours} revenueRange={revenueRange} onCTAClick={handleCTAClick} />
  );
  const overwhelm = <OverwhelmSection key="overwhelm" onCTAClick={handleCTAClick} />;
  const howItWorks = <HowItWorksSection key="how" onCTAClick={handleCTAClick} />;
  const ctaSection = (
    <CTASection
      key="cta"
      firstName={formData?.firstName || ''}
      lastName={formData?.lastName || ''}
      email={formData?.email || ''}
      phone={formData?.phone || ''}
      painPoints={formData?.painPoints || ''}
      leadId={formData?.leadId || ''}
      meta_fbc={formData?.meta_fbc || ''}
      meta_fbp={formData?.meta_fbp || ''}
      revenue={revenueRange}
    />
  );
  const socialProof = <SocialProofSection key="social" onCTAClick={handleCTAClick} />;
  const faq = <FAQSection key="faq" onCTAClick={handleCTAClick} />;
  const finalCta = <FinalCTASection key="final" annualHours={annualHours} onButtonClick={handleCTAClick} />;

  const confirmationBanner = (
    <ConfirmationBanner key="banner" email={formData?.email || ''} />
  );
  const videoSection =
    variation === 'video' && reportVideoUrl ? (
      <VideoSection key="video" videoUrl={reportVideoUrl} />
    ) : null;

  const controlOrder = [
    navHeader, heroPain, costCard, overwhelm, howItWorks, ctaSection, socialProof, faq, finalCta,
  ];
  const videoOrder = [
    navHeader, confirmationBanner, videoSection, ctaSection, heroPain, costCard, overwhelm, howItWorks, socialProof, faq, finalCta,
  ];

  const sections = variation === 'video' ? videoOrder : controlOrder;

  return (
    <div className="w-full" style={{ background: '#f1f5f9' }}>
      {sections}

      {/* Email toast notification - auto-dismisses after 5s */}
      {showEmailToast && formData?.email && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            right: '24px',
            background: 'white',
            color: '#475569',
            padding: '12px 16px',
            borderRadius: '10px',
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            animation: 'toastSlideIn 0.4s ease-out',
            maxWidth: '360px',
            overflow: 'hidden',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13L2 4" />
          </svg>
          <span>
            Your personalized report is being written and will arrive at{' '}
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{formData.email}</span>
            {' '}in 2-3 minutes
          </span>
          <button
            onClick={() => setShowEmailToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0 0 0 4px',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
          {/* Countdown progress bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: '#e2e8f0',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#f59e0b',
                animation: 'toastCountdown 8s linear forwards',
              }}
            />
          </div>
        </div>
      )}

      {/* Page-level styles */}
      <style>{`
        body { background: #0f172a !important; }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
