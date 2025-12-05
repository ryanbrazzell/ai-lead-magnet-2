/**
 * EmailScreen - Screen 2
 * Collects email address, updates lead in Close CRM
 */

"use client";

import * as React from 'react';
import { FormInput } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validateEmail } from '@/lib/form-validation';
import { PreviousLink } from './previous-link';

interface EmailScreenProps {
  email: string;
  error?: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (email: string) => Promise<void>;
}

export function EmailScreen({
  email,
  error,
  isLoading,
  onEmailChange,
  onPrevious,
  onSubmit,
}: EmailScreenProps) {
  const [localError, setLocalError] = React.useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
      return;
    }

    setLocalError(undefined);
    await onSubmit(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
    // Clear error when user types
    if (localError) {
      setLocalError(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-question text-center">
        Where should I <strong>email</strong> it to?
      </h2>

      <FormInput
        type="email"
        placeholder="Business email address"
        value={email}
        onChange={handleEmailChange}
        error={localError || error}
        id="email"
        autoComplete="email"
      />

      <div className="flex justify-center">
        <PillButton type="submit" variant="progress" loading={isLoading}>
          CONTINUE
        </PillButton>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
