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

// Default task hours used for ROI calculation
const DEFAULT_TASK_HOURS = {
  email: 3,
  personalLife: 2,
  calendar: 2,
  businessProcesses: 3,
};

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

            // TEMPORARILY DISABLED FOR TESTING - Close CRM lead creation
            // const leadPromise = (async () => {
            //   try {
            //     const response = await fetch('/api/close/create-lead', {
            //       method: 'POST',
            //       headers: { 'Content-Type': 'application/json' },
            //       body: JSON.stringify({
            //         firstName: formData.firstName,
            //         lastName: formData.lastName,
            //         email,
            //         meta_fbc: fbc,
            //         meta_fbp: fbp,
            //       }),
            //     });

            //     const data = await response.json();

            //     if (data.success && data.leadId) {
            //       setLeadId(data.leadId);
            //       return data.leadId;
            //     } else {
            //       console.error('Failed to create lead:', data.error);
            //       return null;
            //     }
            //   } catch (error) {
            //     console.error('Error creating lead:', error);
            //     return null;
            //   }
            // })();

            // pendingLeadIdRef.current = leadPromise;
            console.log('[TEST MODE] Close CRM lead creation disabled');
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

            // TEMPORARILY DISABLED FOR TESTING - Close CRM update (phone)
            console.log('[TEST MODE] Close CRM phone update disabled');
            // (async () => {
            //   let currentLeadId = leadId;
            //   if (!currentLeadId && pendingLeadIdRef.current) {
            //     currentLeadId = await pendingLeadIdRef.current || '';
            //     if (currentLeadId) {
            //       setLeadId(currentLeadId);
            //     }
            //   }

            //   if (currentLeadId) {
            //     try {
            //       await fetch('/api/close/update-lead', {
            //         method: 'PUT',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ leadId: currentLeadId, phone }),
            //       });
            //     } catch (error) {
            //       console.error('Error updating lead with phone:', error);
            //     }
            //   }
            // })();
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
            // Use current leadId immediately
            const currentLeadId = leadId;

            // Encode form data for report page with default task hours
            const reportData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              revenue: revenue,
              painPoints: painPoints,
              taskHours: DEFAULT_TASK_HOURS,
              leadId: currentLeadId,
              meta_fbc: fbc,
              meta_fbp: fbp,
            };

            // Navigate immediately
            const encodedData = btoa(JSON.stringify(reportData));
            window.location.href = `/report?data=${encodeURIComponent(encodedData)}`;

            // TEMPORARILY DISABLED FOR TESTING - Close CRM update (business details)
            console.log('[TEST MODE] Close CRM business details update disabled');
          }}
        />
      )}
    </div>
  );
}
