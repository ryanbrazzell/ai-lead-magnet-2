/**
 * Tests for FormStep1 component
 * Task Group 3.1: Focused tests for Step 1 form component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormStep1 } from '../form-step1';

// Mock the sendToZapier function to avoid network calls
vi.mock('@/lib/zapier', () => ({
  sendToZapier: vi.fn(() => Promise.resolve()),
}));

describe('FormStep1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all 4 form fields', () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit={mockOnSubmit} />);

    // Check for first name field
    expect(screen.getByPlaceholderText(/FIRST NAME/i)).toBeInTheDocument();

    // Check for last name field
    expect(screen.getByPlaceholderText(/LAST NAME/i)).toBeInTheDocument();

    // Check for title field (select dropdown)
    expect(screen.getByText(/SELECT YOUR TITLE/i)).toBeInTheDocument();

    // Check for phone field
    expect(screen.getByPlaceholderText(/\(555\) 123-4567/i)).toBeInTheDocument();

    // Check for Continue button
    expect(screen.getByRole('button', { name: /CONTINUE/i })).toBeInTheDocument();
  });

  it('should display error messages when fields are invalid on blur', async () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit=
{mockOnSubmit} />);

    const firstNameInput = screen.getByPlaceholderText(/FIRST NAME/i);

    // Trigger blur without entering a value
    fireEvent.focus(firstNameInput);
    fireEvent.blur(firstNameInput);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });
  });

  it('should clear errors when user starts typing', async () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit={mockOnSubmit} />);

    const firstNameInput = screen.getByPlaceholderText(/FIRST NAME/i);

    // Trigger blur to show error
    fireEvent.focus(firstNameInput);
    fireEvent.blur(firstNameInput);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });

    // Type to clear error
    fireEvent.change(firstNameInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.queryByText(/First name is required/i)).not.toBeInTheDocument();
    });
  });

  it('should validate phone number format on blur', async () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(/\(555\) 123-4567/i);

    // Enter invalid phone (too short)
    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
    });

    // Enter valid phone
    fireEvent.change(phoneInput, { target: { value: '(555) 123-4567' } });

    await waitFor(() => {
      expect(screen.queryByText(/Please enter a valid phone number/i)).not.toBeInTheDocument();
    });
  });

  it('should not call onSubmit when validation fails', async () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit={mockOnSubmit} />);

    const continueButton = screen.getByRole('button', { name: /CONTINUE/i });

    // Submit form without filling fields
    fireEvent.click(continueButton);

    // Wait a bit
    await waitFor(() => {
      // onSubmit should not be called since validation failed
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should render Continue button with correct variant', () => {
    const mockOnSubmit = vi.fn();
    render(<FormStep1 onSubmit={mockOnSubmit} />);

    const continueButton = screen.getByRole('button', { name: /CONTINUE/i });

    // Check that button has progress variant (yellow background)
    expect(continueButton).toHaveClass('bg-progress');
  });
});
