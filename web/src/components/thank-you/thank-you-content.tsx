/**
 * ThankYouContent Component
 * Main report page composition
 *
 * Sections in order:
 * 1. Navigation Header (navy bar with logo)
 * 2. Success Banner (green gradient) - with email status (sending/sent/error)
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
import { HeroPain } from './hero-pain';
import { CostCard } from './cost-card';
import { CTASection } from './cta-section';
import { SocialProofSection } from './social-proof-section';
import { FAQSection } from './faq-section';
import { FinalCTASection } from './final-cta-section';
import { HowItWorksSection } from './how-it-works-section';
import { OverwhelmSection } from './overwhelm-section';
import { AnalyzingAnimation } from './analyzing-animation';
import { calculateROI, getTaskHoursByRevenue, type TaskHours } from '@/lib/roi-calculator';

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
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

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

  // Generate PDF and send email when analysis completes
  const generateAndSendReport = React.useCallback(async () => {
    if (!formData?.email) return;

    // Reset states for safe re-calling (retry support)
    setEmailSent(false);
    setEmailError(null);

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

      // Generate PDF (include all user data for pre-filled booking URL)
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksResult.data?.tasks || { daily: [], weekly: [], monthly: [] },
          eaPercentage: tasksResult.data?.ea_task_percent || 0,
          userData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            stage: 4,
            stageName: 'Prioritize',
          },
          taskHours: taskHours,
          revenueRange: revenueRange,
        }),
      });

      const pdfResult = await pdfResponse.json();

      if (!pdfResult.success || !pdfResult.pdf) {
        console.error('Failed to generate PDF');
        setEmailError('Failed to generate PDF');
        return;
      }

      // Store blob URL if available (for download fallback)
      if (pdfResult.blobUrl) {
        setBlobUrl(pdfResult.blobUrl);
      }

      // Send email with PDF (include phone for pre-filled booking URL)
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
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

      // Update Close CRM with report URL (if we have leadId and blobUrl)
      if (formData.leadId && pdfResult.blobUrl) {
        try {
          await fetch('/api/close/update-lead', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: formData.leadId,
              reportUrl: pdfResult.blobUrl,
            }),
          });
          console.log('Close CRM updated with report URL:', pdfResult.blobUrl);
        } catch (err) {
          console.error('Failed to update Close CRM with report URL:', err);
          // Non-blocking - don't fail the whole flow
        }
      }
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

      {/* 2. Success Banner with email delivery status */}
      <div
        className="text-center text-white"
        style={{
          fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
          background: emailError
            ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          padding: '20px 16px',
          fontWeight: 500,
        }}
      >
        {emailError ? (
          <>
            <div style={{ marginBottom: '4px' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"
                  fill="currentColor"
                />
              </svg>
              <strong>We had trouble sending your report. Don&apos;t worry — your report is ready.</strong>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>
              {blobUrl
                ? 'You can download it directly below, or try sending it again.'
                : 'Click below to try sending it again.'}
            </div>
            <button
              onClick={() => generateAndSendReport()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Resend Report
            </button>
          </>
        ) : emailSent ? (
          <>
            <div style={{ marginBottom: '4px' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
                  fill="currentColor"
                />
              </svg>
              <strong>Your personalized Time Freedom Report has been sent to {formData?.email || 'your inbox'}.</strong>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              While you wait, scroll down to see exactly how much doing $15/hr admin work is really costing you.
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '4px' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', animation: 'spin 2s linear infinite' }}
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
                  fill="currentColor"
                />
              </svg>
              <strong>Your personalized Time Freedom Report is heading to {formData?.email || 'your inbox'}.</strong>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              While you wait, scroll down to see exactly how much doing $15/hr admin work is really costing you.
            </div>
          </>
        )}

        {/* PDF download fallback link - shown whenever blobUrl is available */}
        {blobUrl && (
          <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.85 }}>
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Download your report (PDF)
            </a>
          </div>
        )}
      </div>

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
        revenue={revenueRange}
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
