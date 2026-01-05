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
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';

interface FormDataFromURL {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  revenue: string;
  painPoints: string;
  leadId: string;
  taskHours?: TaskHours;
}

export function ThankYouContent() {
  const searchParams = useSearchParams();

  const [showAnalyzing, setShowAnalyzing] = React.useState(true);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

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
      const decoded = atob(encodedData);
      return JSON.parse(decoded) as FormDataFromURL;
    } catch {
      console.error('Failed to decode form data from URL');
      return null;
    }
  }, [searchParams]);

  // Default task hours if not provided
  const taskHours: TaskHours = formData?.taskHours ?? {
    email: 3,
    personalLife: 2,
    calendar: 2,
    businessProcesses: 3,
  };

  // Calculate ROI for email
  const roi = React.useMemo(
    () => calculateROI(taskHours, formData?.revenue || '$500k to $1M'),
    [taskHours, formData?.revenue]
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

  // Generate PDF and send email when analysis completes
  const generateAndSendReport = React.useCallback(async () => {
    if (!formData?.email) return;

    try {
      // First, generate the tasks via AI
      const tasksResponse = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          revenue: formData.revenue,
          painPoints: formData.painPoints,
          leadType: 'main',
          timestamp: new Date().toISOString(),
        }),
      });

      const tasksResult = await tasksResponse.json();

      if (!tasksResult.success) {
        console.error('Failed to generate tasks:', tasksResult.error);
        setEmailError('Failed to generate report');
        return;
      }

      // Generate PDF
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksResult.data?.tasks || { daily: [], weekly: [], monthly: [] },
          eaPercentage: tasksResult.data?.ea_task_percent || 0,
          userData: {
            firstName: formData.firstName,
            stage: 4,
            stageName: 'Prioritize',
          },
          taskHours: taskHours,
          revenueRange: formData.revenue || '$500k to $1M',
        }),
      });

      const pdfResult = await pdfResponse.json();

      if (!pdfResult.success || !pdfResult.pdf) {
        console.error('Failed to generate PDF');
        setEmailError('Failed to generate PDF');
        return;
      }

      // Send email with PDF
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          pdfBuffer: pdfResult.pdf,
        }),
      });

      const emailResult = await emailResponse.json();

      if (emailResult.success) {
        setEmailSent(true);
      } else {
        console.error('Failed to send email:', emailResult.error);
        setEmailError(emailResult.error || 'Failed to send email');
      }

      console.log('[TEST MODE] Close CRM report URL update disabled');
    } catch (err) {
      console.error('Error generating/sending report:', err);
      setEmailError('Failed to generate report');
    }
  }, [formData, taskHours, roi]);

  // Handle analysis complete
  const handleAnalysisComplete = React.useCallback(() => {
    setShowAnalyzing(false);
    generateAndSendReport();
  }, [generateAndSendReport]);

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
        revenueRange={formData?.revenue || '$500k to $1M'}
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
