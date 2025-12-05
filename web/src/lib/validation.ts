/**
 * Form validation utilities
 * Task Group 1: Validation functions for Step 1 form
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates phone number
 * - Strips non-digit characters using regex
 * - Checks minimum 10 digits
 *
 * @param phone - Phone number string in any format
 * @returns ValidationResult with isValid boolean and optional error message
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  // Strip all non-digit characters
  const cleanedPhone = phone.replace(/\D/g, '');

  // Check if we have at least 10 digits
  if (cleanedPhone.length < 10) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (at least 10 digits)',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates required fields (firstName, lastName, title)
 *
 * @param value - Field value to validate
 * @param fieldName - Name of the field (firstName, lastName, title)
 * @returns ValidationResult with isValid boolean and optional error message
 */
export function validateRequired(
  value: string,
  fieldName: 'firstName' | 'lastName' | 'title'
): ValidationResult {
  // Check if value is empty or only whitespace
  if (!value || !value.trim()) {
    const errorMessages: Record<string, string> = {
      firstName: 'First name is required',
      lastName: 'Last name is required',
      title: 'Please select your title',
    };

    return {
      isValid: false,
      error: errorMessages[fieldName],
    };
  }

  return {
    isValid: true,
  };
}
