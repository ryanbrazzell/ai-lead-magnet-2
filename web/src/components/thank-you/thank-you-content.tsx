/**
 * ThankYouContent Component
 * Main content for the thank-you page including:
 * - Confirmation banner
 * - Video player with stage result
 * - Timer countdown CTA
 * - Calendar scheduling section
 * - Report display section
 */

"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmationBanner } from './confirmation-banner';
import { VideoSection } from './video-section';
import { TimerCTA } from './timer-cta';
import { CalendarSection } from './calendar-section';
import { ReportSection } from './report-section';
import { VideoTestimonials } from '@/components/social-proof/video-testimonials';
import type { TaskGenerationResult } from '@/types';

interface FormDataFromURL {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employees: string;
  revenue: string;
  painPoints: string;
  leadId: string;
}

export function ThankYouContent() {
  const searchParams = useSearchParams();
  
  const [reportData, setReportData] = React.useState<TaskGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stage, setStage] = React.useState<number>(4); // Default stage
  const [stageName, setStageName] = React.useState<string>('Prioritize');

  // Parse form data from URL params (base64 encoded)
  const formData = React.useMemo<FormDataFromURL | null>(() => {
    const encodedData = searchParams.get('data');
    if (!encodedData) {
      // Check for individual params as fallback
      const firstName = searchParams.get('firstName') || '';
      const lastName = searchParams.get('lastName') || '';
      const email = searchParams.get('email') || '';
      
      if (email) {
        return {
          firstName,
          lastName,
          email,
          phone: searchParams.get('phone') || '',
          employees: searchParams.get('employees') || '',
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

  // Determine business stage based on revenue
  React.useEffect(() => {
    if (!formData?.revenue) return;
    
    const revenueStageMap: Record<string, { stage: number; name: string }> = {
      'Under $100k': { stage: 1, name: 'Start' },
      '$100k to $250k': { stage: 2, name: 'Build' },
      '$250K to $500k': { stage: 2, name: 'Build' },
      '$500k to $1M': { stage: 3, name: 'Scale' },
      '$1M to $3M': { stage: 4, name: 'Prioritize' },
      '$3M to $10M': { stage: 5, name: 'Optimize' },
      '$10M to $30M': { stage: 6, name: 'Maximize' },
      '$30 Million+': { stage: 7, name: 'Exit' },
    };
    
    const stageInfo = revenueStageMap[formData.revenue];
    if (stageInfo) {
      setStage(stageInfo.stage);
      setStageName(stageInfo.name);
    }
  }, [formData?.revenue]);

  // Generate the AI report
  React.useEffect(() => {
    const generateReport = async () => {
      if (!formData?.email) {
        setIsGenerating(false);
        return;
      }

      try {
        setIsGenerating(true);
        setError(null);

        const response = await fetch('/api/generate-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            employees: formData.employees,
            revenue: formData.revenue,
            painPoints: formData.painPoints,
            leadType: 'main',
            timestamp: new Date().toISOString(),
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setReportData(result.data);
          
          // Update Close CRM with report URL if we have a lead ID
          if (formData.leadId) {
            try {
              await fetch('/api/close/update-lead', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  leadId: formData.leadId,
                  reportUrl: window.location.href,
                }),
              });
            } catch (updateError) {
              console.error('Failed to update lead with report URL:', updateError);
            }
          }
        } else {
          setError(result.error || 'Failed to generate report');
        }
      } catch (err) {
        console.error('Error generating report:', err);
        setError('An error occurred while generating your report. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateReport();
  }, [formData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Confirmation Banner */}
      <ConfirmationBanner 
        message="Your EA Time Freedom Report is being sent to your inbox"
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Important Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            IMPORTANT - Before You Check Your Email, Watch This Video
          </h1>
          <p className="text-gray-600 text-lg">
            We&apos;re selecting only 100 businesses for an exclusive EA implementation workshop.
          </p>
        </div>

        {/* Stage Result */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Congratulations, You&apos;re Stage {stage}: {stageName}
          </h2>
        </div>

        {/* Video Section */}
        <VideoSection />

        {/* Timer CTA */}
        <TimerCTA 
          initialSeconds={60}
          primaryText="See If I'm a Fit for an EA Workshop"
          primaryHref="#calendar-section"
          secondaryText="No thanks, just take me to my report"
          onSecondaryClick={() => {
            // Scroll to report section
            document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onPrimaryClick={() => {
            // Scroll to calendar section
            document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Calendar Scheduling Section (iClosed) */}
        <div id="calendar-section">
          <CalendarSection
            firstName={formData?.firstName || ''}
            lastName={formData?.lastName || ''}
            email={formData?.email || ''}
            phone={formData?.phone || ''}
          />
        </div>

        {/* Report Section */}
        <div id="report-section">
          <ReportSection
            data={reportData}
            isLoading={isGenerating}
            error={error}
            firstName={formData?.firstName || 'there'}
            stage={stage}
            stageName={stageName}
          />
        </div>
      </div>

      {/* Video Testimonials Section */}
      <VideoTestimonials />
    </div>
  );
}

