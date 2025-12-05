/**
 * Form Validation Utilities
 * Task Group 2: Multi-Step Form Components
 *
 * Validation functions for the multi-step form fields.
 */

/**
 * Validates required text field (non-empty)
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validates phone number (minimum 10 digits)
 * Accepts formats: (123) 456-7890, 123-456-7890, 1234567890
 */
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }

  // Strip non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return 'Please enter a valid phone number (at least 10 digits)';
  }

  return null;
}

/**
 * Formats phone number to E.164 format (+1XXXXXXXXXX)
 */
export function formatPhoneE164(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  return `+1${digitsOnly}`;
}

/**
 * Validates positive number (for employee count)
 */
export function validatePositiveNumber(value: string | number, fieldName: string): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return `Please enter a valid number for ${fieldName}`;
  }

  if (num <= 0) {
    return `${fieldName} must be a positive number`;
  }

  return null;
}

/**
 * Validates dropdown selection (non-empty)
 */
export function validateSelection(value: string, fieldName: string): string | null {
  if (!value || value === '') {
    return `Please select ${fieldName}`;
  }
  return null;
}
