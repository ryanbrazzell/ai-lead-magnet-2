/**
 * MultiStepForm Component
 * ROI Calculator Lead Magnet
 *
 * Flow:
 * 1. Screen 1: Name (First + Last) → No API call → Purple "Let's Start"
 * 2. Screen 2: Email → Create Close lead with name + email → Yellow "Continue"
 * 3. Screen 3: Phone → Update Close lead → Yellow "Continue"
 * 4. Screen 4: Business Details (Revenue + Pain Points) → Purple "See My Report" → Navigate to /report
 */

"use client";

import * as React from 'react';
import { NameScreen } from './screens/name-screen';
import { EmailScreen } from './screens/email-screen';
import { PhoneScreen } from './screens/phone-screen';
import { BusinessDetailsScreen } from './screens/business-details-screen';
import { useMetaTracking } from '@/hooks/use-meta-tracking';

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  revenue: string;
  painPoints: string;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  revenue?: string;
}

const TOTAL_SCREENS = 4;

// Note: taskHours are now calculated on the report page based on revenue tier
// See: src/lib/roi-calculator.ts -> getTaskHoursByRevenue()

export function MultiStepForm() {
  const [currentScreen, setCurrentScreen] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const pendingLeadIdRef = React.useRef<Promise<string | null> | null>(null);

  // LeadId with sessionStorage backup — survives page refresh
  const [leadId, setLeadIdState] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_leadId') || '';
    }
    return '';
  });
  const setLeadId = React.useCallback((id: string) => {
    setLeadIdState(id);
    try { sessionStorage.setItem('al_leadId', id); } catch { /* SSR or private mode */ }
  }, []);

  // Get Meta tracking cookies (_fbc and _fbp) for Close CRM attribution
  const { fbc, fbp } = useMetaTracking();

  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    revenue: '',
    painPoints: '',
  });

  const [errors, setErrors] = React.useState<FormErrors>({});

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const goToNextScreen = () => {
    setCurrentScreen(prev => Math.min(prev + 1, TOTAL_SCREENS));
  };

  const goToPreviousScreen = () => {
    setCurrentScreen(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full">
      {currentScreen === 1 && (
        <NameScreen
          firstName={formData.firstName}
          lastName={formData.lastName}
          errors={errors}
          isLoading={isLoading}
          onFirstNameChange={(value) => updateField('firstName', value)}
          onLastNameChange={(value) => updateField('lastName', value)}
          onSubmit={async () => {
            setErrors({});
            goToNextScreen();
          }}
        />
      )}

      {currentScreen === 2 && (
        <EmailScreen
          email={formData.email}
          error={errors.email}
          isLoading={isLoading}
          onEmailChange={(value) => updateField('email', value)}
          onPrevious={goToPreviousScreen}
          onSubmit={async (email) => {
            goToNextScreen();

            // Close CRM lead creation
            const leadPromise = (async () => {
              try {
                const response = await fetch('/api/close/create-lead', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email,
                    meta_fbc: fbc,
                    meta_fbp: fbp,
                  }),
                });

                const data = await response.json();

                if (data.success && data.leadId) {
                  setLeadId(data.leadId);
                  return data.leadId;
                } else {
                  console.error('Failed to create lead:', data.error);
                  return null;
                }
              } catch (error) {
                console.error('Error creating lead:', error);
                return null;
              }
            })();

            pendingLeadIdRef.current = leadPromise;
          }}
        />
      )}

      {currentScreen === 3 && (
        <PhoneScreen
          phone={formData.phone}
          error={errors.phone}
          isLoading={isLoading}
          onPhoneChange={(value) => updateField('phone', value)}
          onPrevious={goToPreviousScreen}
          onSubmit={async (phone) => {
            goToNextScreen();

            // Close CRM update (phone)
            (async () => {
              let currentLeadId = leadId;
              if (!currentLeadId && pendingLeadIdRef.current) {
                currentLeadId = await pendingLeadIdRef.current || '';
                if (currentLeadId) {
                  setLeadId(currentLeadId);
                }
              }

              if (currentLeadId) {
                try {
                  await fetch('/api/close/update-lead', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: currentLeadId, phone }),
                  });
                } catch (error) {
                  console.error('Error updating lead with phone:', error);
                }
              }
            })();
          }}
        />
      )}

      {currentScreen === 4 && (
        <BusinessDetailsScreen
          revenue={formData.revenue}
          painPoints={formData.painPoints}
          errors={errors}
          isLoading={isLoading}
          onRevenueChange={(value) => updateField('revenue', value)}
          onPainPointsChange={(value) => updateField('painPoints', value)}
          onPrevious={goToPreviousScreen}
          isFinalStep={true}
          onSubmit={async (revenue, painPoints) => {
            setIsLoading(true);

            // Await pending lead creation if leadId isn't set yet (same pattern as Screen 3)
            let currentLeadId = leadId;
            if (!currentLeadId && pendingLeadIdRef.current) {
              currentLeadId = await pendingLeadIdRef.current || '';
              if (currentLeadId) {
                setLeadId(currentLeadId);
              }
            }

            // Encode form data for report page (taskHours calculated on report page based on revenue)
            const reportData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              revenue: revenue,
              painPoints: painPoints,
              leadId: currentLeadId,
              meta_fbc: fbc,
              meta_fbp: fbp,
            };

            // Close CRM update (business details) — fire-and-forget with keepalive
            if (currentLeadId) {
              fetch('/api/close/update-lead', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  leadId: currentLeadId,
                  revenue,
                  painPoints,
                }),
                keepalive: true,
              }).catch(error => console.error('Error updating lead with business details:', error));
            }

            // Fire server-side report generation pipeline — runs to completion
            // even if user closes tab, switches apps, or navigates away
            fetch('/api/generate-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                revenue,
                painPoints,
                leadId: currentLeadId,
              }),
              keepalive: true, // Survives page navigation
            }).catch(error => console.error('Error triggering report generation:', error));

            // Navigate to report page with Unicode-safe base64 encoding
            // btoa() throws on non-Latin1 chars (accented names, emojis in pain points)
            // so we encode via encodeURIComponent first to get safe ASCII bytes
            try {
              const jsonString = JSON.stringify(reportData);
              const encodedData = btoa(
                encodeURIComponent(jsonString).replace(
                  /%([0-9A-F]{2})/g,
                  (_, p1) => String.fromCharCode(parseInt(p1, 16))
                )
              );
              window.location.href = `/report?data=${encodeURIComponent(encodedData)}`;
            } catch (encodeError) {
              console.error('Error encoding report data:', encodeError);
              // Fallback: pass data as individual URL params
              const params = new URLSearchParams({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                revenue: revenue,
                painPoints: painPoints,
                leadId: currentLeadId,
              });
              window.location.href = `/report?${params.toString()}`;
            }
          }}
        />
      )}
    </div>
  );
}
