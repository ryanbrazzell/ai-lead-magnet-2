/**
 * Tests for form validation utilities
 * Task Group 1.1: Focused tests for validation functions
 */

import { describe, it, expect } from 'vitest';
import { validatePhoneNumber, validateRequired } from '../validation';

describe('validatePhoneNumber', () => {
  it('should validate phone numbers with 10+ digits', () => {
    const result = validatePhoneNumber('1234567890');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should strip non-digit characters from formatted phone numbers', () => {
    const result1 = validatePhoneNumber('(123) 456-7890');
    expect(result1.isValid).toBe(true);
    expect(result1.error).toBeUndefined();

    const result2 = validatePhoneNumber('123-456-7890');
    expect(result2.isValid).toBe(true);
    expect(result2.error).toBeUndefined();

    const result3 = validatePhoneNumber('+1 (123) 456-7890');
    expect(result3.isValid).toBe(true);
    expect(result3.error).toBeUndefined();
  });

  it('should reject phone numbers with less than 10 digits', () => {
    const result = validatePhoneNumber('123456789');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid phone number (at least 10 digits)');
  });

  it('should reject empty phone numbers', () => {
    const result = validatePhoneNumber('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid phone number (at least 10 digits)');
  });
});

describe('validateRequired', () => {
  it('should validate non-empty firstName', () => {
    const result = validateRequired('John', 'firstName');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty firstName', () => {
    const result = validateRequired('', 'firstName');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('First name is required');
  });

  it('should reject whitespace-only firstName', () => {
    const result = validateRequired('   ', 'firstName');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('First name is required');
  });

  it('should validate non-empty lastName', () => {
    const result = validateRequired('Doe', 'lastName');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty lastName', () => {
    const result = validateRequired('', 'lastName');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Last name is required');
  });

  it('should validate selected title', () => {
    const result = validateRequired('CEO', 'title');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty title', () => {
    const result = validateRequired('', 'title');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please select your title');
  });
});
