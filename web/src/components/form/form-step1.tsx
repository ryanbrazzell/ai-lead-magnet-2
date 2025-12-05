'use client';

/**
 * FormStep1 Component
 * Task Group 3: Step 1 form with Name, Title, and Phone fields
 *
 * Features:
 * - 4 input fields: First Name, Last Name, Title, Phone
 * - Validation on blur and submit
 * - Inline error display below each field
 * - Continue button with loading state
 * - Zapier webhook integration
 * - Navigation to Step 2 after submission
 */

import * as React from 'react';
import { FormInput, FormInputOption } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validatePhoneNumber, validateRequired } from '@/lib/validation';
import { sendToZapier } from '@/lib/zapier';

// Title options from LeadForm.tsx lines 14-23
const TITLE_OPTIONS: FormInputOption[] = [
  { value: 'CEO', label: 'CEO' },
  { value: 'Founder', label: 'Founder' },
  { value: 'President', label: 'President' },
  { value: 'VP', label: 'VP' },
  { value: 'Director', label: 'Director' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Executive', label: 'Executive' },
  { value: 'Other', label: 'Other' },
];

export interface FormStep1Data {
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
}

export interface FormStep1Props {
  /** Callback when form is successfully submitted */
  onSubmit: (data: FormStep1Data) => void | Promise<void>;
}

/**
 * FormStep1 - Step 1 of the main form
 *
 * Collects basic contact information and fires Zapier webhook
 * before navigating to Step 2.
 */
export function FormStep1({ onSubmit }: FormStep1Props) {
  // Form state
  const [formData, setFormData] = React.useState<FormStep1Data>({
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
  });

  // Error state
  const [errors, setErrors] = React.useState<Partial<FormStep1Data>>({});

  // Loading state
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Validate all fields
   * Returns true if all fields are valid
   */
  const validateAllFields = (): boolean => {
    const newErrors: Partial<FormStep1Data> = {};

    // Validate firstName
    const firstNameResult = validateRequired(formData.firstName, 'firstName');
    if (!firstNameResult.isValid) {
      newErrors.firstName = firstNameResult.error;
    }

    // Validate lastName
    const lastNameResult = validateRequired(formData.lastName, 'lastName');
    if (!lastNameResult.isValid) {
      newErrors.lastName = lastNameResult.error;
    }

    // Validate title
    const titleResult = validateRequired(formData.title, 'title');
    if (!titleResult.isValid) {
      newErrors.title = titleResult.error;
    }

    // Validate phone
    const phoneResult = validatePhoneNumber(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle field blur - validate individual field
   */
  const handleBlur = (fieldName: keyof FormStep1Data) => {
    if (fieldName === 'phone') {
      const result = validatePhoneNumber(formData[fieldName]);
      if (!result.isValid) {
        setErrors((prev) => ({ ...prev, [fieldName]: result.error }));
      }
    } else {
      const result = validateRequired(
        formData[fieldName],
        fieldName as 'firstName' | 'lastName' | 'title'
      );
      if (!result.isValid) {
        setErrors((prev) => ({ ...prev, [fieldName]: result.error }));
      }
    }
  };

  /**
   * Handle field change - update value and clear error
   */
  const handleChange = (fieldName: keyof FormStep1Data, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  /**
   * Handle form submission
   * Validates all fields, sends Zapier webhook, then calls onSubmit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    // Set loading state
    setIsSubmitting(true);

    try {
      // Send to Zapier webhook (non-blocking)
      await sendToZapier({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        phone: formData.phone,
        source: 'EA Time Freedom Report - Step 1',
        step: 'initial_capture',
        timestamp: new Date().toISOString(),
      });

      // Call onSubmit callback
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name fields - 2-column grid on desktop */}
      <div className="grid grid-cols-1 min-[428px]:grid-cols-2 gap-6">
        {/* First Name */}
        <FormInput
          type="text"
          placeholder="FIRST NAME"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          onBlur={() => handleBlur('firstName')}
          error={errors.firstName}
          disabled={isSubmitting}
          required
        />

        {/* Last Name */}
        <FormInput
          type="text"
          placeholder="LAST NAME"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          onBlur={() => handleBlur('lastName')}
          error={errors.lastName}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Title */}
      <FormInput
        type="select"
        placeholder="SELECT YOUR TITLE"
        options={TITLE_OPTIONS}
        selectValue={formData.title}
        onSelectChange={(value) => handleChange('title', value)}
        error={errors.title}
        required
      />

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number to Text Your Report
        </label>
        <FormInput
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={errors.phone}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <PillButton
          type="submit"
          variant="progress"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'CONTINUE...' : 'CONTINUE'}
        </PillButton>
      </div>
    </form>
  );
}

FormStep1.displayName = 'FormStep1';
