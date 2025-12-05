/**
 * PhoneScreen - Screen 3
 * Collects phone number, updates lead in Close CRM
 */

"use client";

import * as React from 'react';
import { FormInput } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validatePhone, formatPhoneE164 } from '@/lib/form-validation';
import { PreviousLink } from './previous-link';

interface PhoneScreenProps {
  phone: string;
  error?: string;
  isLoading: boolean;
  onPhoneChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (phone: string) => Promise<void>;
}

export function PhoneScreen({
  phone,
  error,
  isLoading,
  onPhoneChange,
  onPrevious,
  onSubmit,
}: PhoneScreenProps) {
  const [localError, setLocalError] = React.useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setLocalError(phoneError);
      return;
    }

    setLocalError(undefined);

    // Fire Meta Pixel Lead event - user has provided name + phone
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'EA Time Freedom Report',
        content_category: 'Lead Magnet'
      });
    }

    const formattedPhone = formatPhoneE164(phone);
    await onSubmit(formattedPhone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-question text-center">
        What is your <strong>phone number</strong>?
      </h2>

      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 text-xl font-normal pointer-events-none">
          +1
        </div>
        <FormInput
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          error={localError || error}
          id="phone"
          className="pl-[70px]"
          autoComplete="tel"
        />
      </div>

      <div className="flex justify-center">
        <PillButton type="submit" variant="progress" loading={isLoading}>
          CONTINUE
        </PillButton>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
