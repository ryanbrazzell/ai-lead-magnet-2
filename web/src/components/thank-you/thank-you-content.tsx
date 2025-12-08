/**
 * ThankYouContent Component
 * Hybrid approach: Show compelling hook on screen, full report via email
 *
 * Flow:
 * 1. Analyzing animation (builds anticipation)
 * 2. Hero earnings (the big money number)
 * 3. ROI Dashboard (condensed stats + chart)
 * 4. Video Section
 * 5. CTA to book call
 * 6. Calendar scheduling
 * 7. Email teaser (full report in inbox)
 */

"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmationBanner } from './confirmation-banner';
import { HeroEarnings } from './hero-earnings';
import { AnalyzingAnimation } from './analyzing-animation';
import { VideoSection } from './video-section';
import { CalendarSection } from './calendar-section';
import { ROIDashboard } from './roi-dashboard';
import { VideoTestimonials } from '@/components/social-proof/video-testimonials';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';
import type { TaskGenerationResult } from '@/types';

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

  // Check if we have task hours data (ROI calculator was used)
  const hasROIData = !!formData?.taskHours;
  const totalHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);

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
      const emailResponse = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          pdfBase64: pdfResult.pdf,
          revenueUnlocked: roi.annualRevenueUnlocked,
          weeklyHoursSaved: roi.weeklyHoursDelegated,
          roiMultiplier: roi.roiMultiplier,
        }),
      });

      const emailResult = await emailResponse.json();

      if (emailResult.success) {
        setEmailSent(true);
      } else {
        console.error('Failed to send email:', emailResult.error);
        setEmailError(emailResult.error || 'Failed to send email');
      }

      // TEMPORARILY DISABLED FOR TESTING - Close CRM update (report URL)
      console.log('[TEST MODE] Close CRM report URL update disabled');
      // if (formData.leadId) {
      //   try {
      //     await fetch('/api/close/update-lead', {
      //       method: 'PUT',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         leadId: formData.leadId,
      //         reportUrl: window.location.href,
      //       }),
      //     });
      //   } catch (updateError) {
      //     console.error('Failed to update lead:', updateError);
      //   }
      // }
    } catch (err) {
      console.error('Error generating/sending report:', err);
      setEmailError('Failed to generate report');
    }
  }, [formData, taskHours, roi]);

  // Handle analysis complete
  const handleAnalysisComplete = React.useCallback(() => {
    setShowAnalyzing(false);
    // Start generating and sending the report in background
    generateAndSendReport();
  }, [generateAndSendReport]);

  const scrollToCalendar = () => {
    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Show analyzing animation first
  if (showAnalyzing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyzingAnimation
          firstName={formData?.firstName || 'there'}
          onComplete={handleAnalysisComplete}
          duration={3500}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Banner */}
      <ConfirmationBanner
        message="Your full Time Freedom Report is on its way to your inbox"
      />

      {/* Main Content - Full width with padding */}
      <div className="w-full px-3 py-6 space-y-6">

        {/* 1. Hero Earnings - The big money number + CTA */}
        {hasROIData && totalHours > 0 && (
          <HeroEarnings
            taskHours={taskHours}
            revenueRange={formData?.revenue || '$500k to $1M'}
            firstName={formData?.firstName || 'there'}
            onBookCall={scrollToCalendar}
          />
        )}

        {/* 2. ROI Dashboard - Condensed stats + chart */}
        {hasROIData && totalHours > 0 && (
          <ROIDashboard
            taskHours={taskHours}
            revenueRange={formData?.revenue || '$500k to $1M'}
            firstName={formData?.firstName || 'there'}
          />
        )}

        {/* 3. Video Section */}
        <section className="space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Watch This Important Video
            </h2>
            <p className="text-sm text-gray-500">
              See how busy founders like you reclaimed 10+ hours per week
            </p>
          </div>
          <VideoSection />
        </section>

        {/* 4. Calendar Scheduling Section */}
        <div id="calendar-section">
          <CalendarSection
            firstName={formData?.firstName || ''}
            lastName={formData?.lastName || ''}
            email={formData?.email || ''}
            phone={formData?.phone || ''}
          />
        </div>

      </div>

      {/* Video Testimonials Section */}
      <VideoTestimonials />
    </div>
  );
}
