/**
 * NameScreen - Screen 1
 * Collects first and last name, creates lead in Close CRM
 */

"use client";

import * as React from 'react';
import { FormInput } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validateRequired } from '@/lib/form-validation';
import { FormErrors } from '../multi-step-form';

interface NameScreenProps {
  firstName: string;
  lastName: string;
  errors: FormErrors;
  isLoading: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSubmit: (firstName: string, lastName: string) => Promise<void>;
}

export function NameScreen({
  firstName,
  lastName,
  errors,
  isLoading,
  onFirstNameChange,
  onLastNameChange,
  onSubmit,
}: NameScreenProps) {
  const [localErrors, setLocalErrors] = React.useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const firstNameError = validateRequired(firstName, 'First name');
    const lastNameError = validateRequired(lastName, 'Last name');

    if (firstNameError || lastNameError) {
      setLocalErrors({
        firstName: firstNameError || undefined,
        lastName: lastNameError || undefined,
      });
      return;
    }

    setLocalErrors({});
    await onSubmit(firstName, lastName);
  };

  const displayErrors = { ...localErrors, ...errors };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <FormInput
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          error={displayErrors.firstName}
          id="firstName"
          autoComplete="given-name"
        />
        <FormInput
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          error={displayErrors.lastName}
          id="lastName"
          autoComplete="family-name"
        />
      </div>

      <div className="flex justify-center pt-0 md:pt-4">
        <PillButton type="submit" variant="primary" loading={isLoading}>
          SEND MY REPORT
        </PillButton>
      </div>
    </form>
  );
}
