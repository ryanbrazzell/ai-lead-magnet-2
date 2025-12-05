/**
 * MultiStepForm Component
 * Task Group 2: Multi-Step Form Components
 *
 * A 4-screen progressive disclosure form that captures leads incrementally
 * through Close CRM integration.
 *
 * Flow:
 * 1. Screen 1: Name (First + Last) → No API call → Purple "Let's Start"
 * 2. Screen 2: Email → Create Close lead with name + email → Yellow "Continue"
 * 3. Screen 3: Phone → Update Close lead → Yellow "Continue"
 * 4. Screen 4: Employee Count + Revenue + Pain Points → Update lead → Purple "Get My EA Roadmap"
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
  employees: string;
  revenue: string;
  painPoints: string;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employees?: string;
  revenue?: string;
}

export function MultiStepForm() {
  const [currentScreen, setCurrentScreen] = React.useState(1);
  const [leadId, setLeadId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const pendingLeadIdRef = React.useRef<Promise<string | null> | null>(null);

  // Get Meta tracking cookies (_fbc and _fbp)
  const { fbc, fbp } = useMetaTracking();

  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employees: '',
    revenue: '',
    painPoints: '',
  });

  const [errors, setErrors] = React.useState<FormErrors>({});

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const goToNextScreen = () => {
    setCurrentScreen(prev => Math.min(prev + 1, 4));
  };

  const goToPreviousScreen = () => {
    setCurrentScreen(prev => Math.max(prev - 1, 1));
  };

  // Instant transition - no animation delay (matches acquisition.com/roadmap)
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
          onSubmit={async (firstName, lastName) => {
            // Screen 1: No API call, just proceed to next screen
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
            // Transition immediately - don't wait for API call
            goToNextScreen();
            
            // Fire API call in background (non-blocking)
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
            // Transition immediately - don't wait for API call
            goToNextScreen();
            
            // Fire API call in background (non-blocking)
            // Wait for leadId if it's still being created from previous screen
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
          employees={formData.employees}
          revenue={formData.revenue}
          painPoints={formData.painPoints}
          errors={errors}
          isLoading={isLoading}
          onEmployeesChange={(value) => updateField('employees', value)}
          onRevenueChange={(value) => updateField('revenue', value)}
          onPainPointsChange={(value) => updateField('painPoints', value)}
          onPrevious={goToPreviousScreen}
          onSubmit={async (employees, revenue, painPoints) => {
            // Use current leadId immediately (don't wait)
            const currentLeadId = leadId;
            
            // Encode form data for thank-you page
            const thankYouData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              employees,
              revenue,
              painPoints,
              leadId: currentLeadId,
              meta_fbc: fbc,
              meta_fbp: fbp,
            };
            
            // Navigate immediately - don't wait for API call
            const encodedData = btoa(JSON.stringify(thankYouData));
            window.location.href = `/report?data=${encodeURIComponent(encodedData)}`;
            
            // Fire API call in background (non-blocking)
            // Handle leadId resolution asynchronously
            (async () => {
              let finalLeadId = currentLeadId;
              if (!finalLeadId && pendingLeadIdRef.current) {
                finalLeadId = await pendingLeadIdRef.current || '';
              }
              
              if (finalLeadId) {
                try {
                  await fetch('/api/close/update-lead', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      leadId: finalLeadId,
                      employees,
                      revenue,
                      painPoints,
                    }),
                  });
                } catch (error) {
                  console.error('Error updating lead with business details:', error);
                }
              }
            })();
          }}
        />
      )}
    </div>
  );
}
