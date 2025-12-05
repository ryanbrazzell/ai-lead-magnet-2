/**
 * Tests for Multi-Step Form Components
 * Task Group 2: Multi-Step Form Components
 *
 * Tests cover:
 * - Screen navigation (forward and backward)
 * - Form validation on Screen 1 (name fields required)
 * - Button loading states during API calls
 * - Data persistence when navigating between screens
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiStepForm } from '../multi-step-form';

// Mock fetch for API calls
beforeEach(() => {
  vi.stubEnv('CLOSE_API_KEY', 'test_api_key');
  global.fetch = vi.fn();
});

describe('MultiStepForm', () => {
  it('should render Screen 1 (name collection) by default', () => {
    render(<MultiStepForm />);
    expect(screen.getByPlaceholderText(/FIRST NAME/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LAST NAME/i)).toBeInTheDocument();
  });

  it('should validate required fields on Screen 1', async () => {
    render(<MultiStepForm />);

    const submitButton = screen.getByRole('button', { name: /LET'S START/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
    });
  });

  it('should navigate to Screen 2 after successful Screen 1 submission', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, leadId: 'lead_123' }),
    });

    render(<MultiStepForm />);

    const firstNameInput = screen.getByPlaceholderText(/FIRST NAME/i);
    const lastNameInput = screen.getByPlaceholderText(/LAST NAME/i);
    const submitButton = screen.getByRole('button', { name: /LET'S START/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
    });
  });

  it('should show Previous link on Screen 2', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, leadId: 'lead_123' }),
    });

    render(<MultiStepForm />);

    // Fill Screen 1
    fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

    await waitFor(() => {
      expect(screen.getByText(/Previous/i)).toBeInTheDocument();
    });
  });

  it('should preserve data when navigating backward', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, leadId: 'lead_123' }),
    });

    render(<MultiStepForm />);

    // Fill Screen 1
    const firstNameInput = screen.getByPlaceholderText(/FIRST NAME/i);
    const lastNameInput = screen.getByPlaceholderText(/LAST NAME/i);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

    // Wait for Screen 2
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
    });

    // Go back to Screen 1
    fireEvent.click(screen.getByText(/Previous/i));

    await waitFor(() => {
      expect((screen.getByPlaceholderText(/FIRST NAME/i) as HTMLInputElement).value).toBe('John');
      expect((screen.getByPlaceholderText(/LAST NAME/i) as HTMLInputElement).value).toBe('Doe');
    });
  });

  it('should show loading state during API call', async () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, leadId: 'lead_123' }),
      }), 100))
    );

    render(<MultiStepForm />);

    fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });

    const submitButton = screen.getByRole('button', { name: /LET'S START/i });
    fireEvent.click(submitButton);

    // Check for loading spinner
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});
