/**
 * ThankYouContent Component
 * Main report page composition
 *
 * Sections in order:
 * 1. Navigation Header (navy bar with logo)
 * 2. Success Banner (green gradient)
 * 3. Hero Pain (navy, "highest-paid assistant")
 * 4. Cost Card (time lost + ROI breakdown + video)
 * 5. How It Works (Right Person, Right Process, Right Support)
 * 6. CTA Section with Calendar (iClosed widget)
 * 7. Social Proof (testimonials)
 * 8. Final CTA
 */

"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ConfirmationBanner } from './confirmation-banner';
import { HeroPain } from './hero-pain';
import { CostCard } from './cost-card';
import { CTASection } from './cta-section';
import { SocialProofSection } from './social-proof-section';
import { FAQSection } from './faq-section';
import { FinalCTASection } from './final-cta-section';
import { HowItWorksSection } from './how-it-works-section';
import { OverwhelmSection } from './overwhelm-section';
import { AnalyzingAnimation } from './analyzing-animation';
import { getTaskHoursByRevenue, type TaskHours } from '@/lib/roi-calculator';

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

  // Parse form data from URL params (base64 encoded)
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

  // Calculate annual hours for display
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  const annualHours = totalWeeklyHours * 52;

  // Handle CTA button clicks to scroll to calendar section container
  const handleCTAClick = React.useCallback(() => {
    setTimeout(() => {
      document.getElementById('schedule-call-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Animation done = page reveals (report generates server-side, fired at form submit)
  const handleAnalysisComplete = React.useCallback(() => {
    setShowAnalyzing(false);
  }, []);

  // Show analyzing animation first
  if (showAnalyzing) {
    return (
      <AnalyzingAnimation
        firstName={formData?.firstName || 'there'}
        onComplete={handleAnalysisComplete}
        duration={3500}
      />
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: '#f1f5f9' }}>
      {/* 1. Navigation Header */}
      <Header 
        logo={<span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '24px', color: '#f59e0b' }}>Assistant Launch 🚀</span>} 
        href="https://www.assistantlaunch.com" 
        showNav={true}
        className="bg-[#0f172a]"
      />

      {/* 2. Success Banner */}
      <ConfirmationBanner email={formData?.email} />

      {/* 3. Hero Pain Section */}
      <HeroPain firstName={formData?.firstName || 'there'} />

      {/* 4. Cost Card (overlaps hero) */}
      <CostCard
        taskHours={taskHours}
        revenueRange={revenueRange}
      />

      {/* 5. Overwhelm Section - Shows everything they're still doing + client proof */}
      <OverwhelmSection />

      {/* 6. How It Works + Future Pacing */}
      <HowItWorksSection />

      {/* 7. CTA Section with Calendar */}
      <CTASection
        firstName={formData?.firstName || ''}
        lastName={formData?.lastName || ''}
        email={formData?.email || ''}
        phone={formData?.phone || ''}
        painPoints={formData?.painPoints || ''}
        leadId={formData?.leadId || ''}
        meta_fbc={formData?.meta_fbc || ''}
        meta_fbp={formData?.meta_fbp || ''}
      />

      {/* 7. Social Proof */}
      <SocialProofSection />

      {/* 8. FAQ Section */}
      <FAQSection />

      {/* 9. Final CTA */}
      <FinalCTASection annualHours={annualHours} onButtonClick={handleCTAClick} />
    </div>
  );
}
