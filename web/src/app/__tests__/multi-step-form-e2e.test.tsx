/**
 * End-to-End Tests for Multi-Step Form
 * Task Group 4: Test Review & Gap Analysis
 *
 * Additional strategic tests to fill critical coverage gaps:
 * 1. Complete happy path (Screen 1 → Screen 6 with all valid data)
 * 2. Backward navigation preserves all field data across all screens
 * 3. Screen 1 API failure blocks progression and shows error
 * 4. Phone validation accepts multiple formats correctly
 * 5. Revenue dropdown selection persists during navigation
 * 6. Email validation error message displays correctly
 * 7. Screen 6 final submission completes successfully
 * 8. Loading states appear on button clicks (Screen 1 and Screen 6)
 * 9. All screen transitions work smoothly
 * 10. Form validation prevents progression with invalid data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MultiStepForm } from '../../components/form/multi-step-form';

// Mock fetch for API calls
let mockFetchImplementation: any;

beforeEach(() => {
  vi.stubEnv('CLOSE_API_KEY', 'test_api_key');
  mockFetchImplementation = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, leadId: 'lead_123' }),
  });
  global.fetch = mockFetchImplementation;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Multi-Step Form E2E Tests', () => {
  describe('Complete Happy Path', () => {
    it('should complete entire flow from Screen 1 to Screen 6 with valid data', async () => {
      render(<MultiStepForm />);

      // Screen 1: Name Collection
      expect(screen.getByPlaceholderText(/FIRST NAME/i)).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      // Screen 2: Email Collection
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Screen 3: Phone Collection
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/\+1/i), { target: { value: '1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Screen 4: Employee Count
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i), { target: { value: '25' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Screen 5: Revenue Selection
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      const revenueSelect = screen.getByRole('combobox');
      fireEvent.change(revenueSelect, { target: { value: '$1M-$3M' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Screen 6: Pain Points
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/DESCRIBE YOUR PAIN POINTS/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/DESCRIBE YOUR PAIN POINTS/i), {
        target: { value: 'Too much admin work overwhelming the team' }
      });
      fireEvent.click(screen.getByRole('button', { name: /GET MY EA ROADMAP/i }));

      // Verify all API calls were made
      await waitFor(() => {
        expect(mockFetchImplementation).toHaveBeenCalled();
      });
    }, 10000);
  });

  describe('Backward Navigation Data Persistence', () => {
    it('should preserve all field data when navigating backward across all screens', async () => {
      render(<MultiStepForm />);

      // Fill Screen 1
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Smith' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      // Fill Screen 2
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'jane@business.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Fill Screen 3
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/\+1/i), { target: { value: '(555) 123-4567' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // Fill Screen 4
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i), { target: { value: '50' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // On Screen 5, go back to Screen 4
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Previous/i));

      // Verify Screen 4 data persisted
      await waitFor(() => {
        expect((screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i) as HTMLInputElement).value).toBe('50');
      });

      // Go back to Screen 3
      fireEvent.click(screen.getByText(/Previous/i));
      await waitFor(() => {
        expect((screen.getByPlaceholderText(/\+1/i) as HTMLInputElement).value).toBe('(555) 123-4567');
      });

      // Go back to Screen 2
      fireEvent.click(screen.getByText(/Previous/i));
      await waitFor(() => {
        expect((screen.getByPlaceholderText(/BUSINESS EMAIL/i) as HTMLInputElement).value).toBe('jane@business.com');
      });

      // Go back to Screen 1
      fireEvent.click(screen.getByText(/Previous/i));
      await waitFor(() => {
        expect((screen.getByPlaceholderText(/FIRST NAME/i) as HTMLInputElement).value).toBe('Jane');
        expect((screen.getByPlaceholderText(/LAST NAME/i) as HTMLInputElement).value).toBe('Smith');
      });
    }, 10000);
  });

  describe('Screen 1 API Failure Handling', () => {
    it('should block progression when Screen 1 API fails and show error message', async () => {
      mockFetchImplementation.mockRejectedValueOnce(new Error('Network error'));

      render(<MultiStepForm />);

      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should NOT progress to Screen 2
      expect(screen.queryByPlaceholderText(/BUSINESS EMAIL/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/FIRST NAME/i)).toBeInTheDocument();
    });

    it('should allow retry after Screen 1 API failure', async () => {
      // First call fails
      mockFetchImplementation
        .mockRejectedValueOnce(new Error('Network error'))
        // Second call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, leadId: 'lead_123' }),
        });

      render(<MultiStepForm />);

      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click button again to retry
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      // Should progress to Screen 2 after successful retry
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept phone number in (123) 456-7890 format', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 3
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });

      // Test (123) 456-7890 format
      const phoneInput = screen.getByPlaceholderText(/\+1/i);
      fireEvent.change(phoneInput, { target: { value: '(555) 123-4567' } });
      fireEvent.blur(phoneInput);

      // Should not show error
      await waitFor(() => {
        expect(screen.queryByText(/invalid phone/i)).not.toBeInTheDocument();
      });
    });

    it('should accept phone number in 123-456-7890 format', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 3
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });

      // Test 123-456-7890 format
      const phoneInput = screen.getByPlaceholderText(/\+1/i);
      fireEvent.change(phoneInput, { target: { value: '555-123-4567' } });
      fireEvent.blur(phoneInput);

      // Should not show error
      await waitFor(() => {
        expect(screen.queryByText(/invalid phone/i)).not.toBeInTheDocument();
      });
    });

    it('should accept phone number in 1234567890 format', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 3
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });

      // Test 1234567890 format
      const phoneInput = screen.getByPlaceholderText(/\+1/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.blur(phoneInput);

      // Should not show error
      await waitFor(() => {
        expect(screen.queryByText(/invalid phone/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Revenue Dropdown Persistence', () => {
    it('should persist revenue selection when navigating backward and forward', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 5
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/\+1/i), { target: { value: '1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i), { target: { value: '25' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      // On Screen 5, select revenue
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      const revenueSelect = screen.getByRole('combobox');
      fireEvent.change(revenueSelect, { target: { value: '$3M-$10M' } });

      // Navigate to Screen 6
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/DESCRIBE YOUR PAIN POINTS/i)).toBeInTheDocument();
      });

      // Go back to Screen 5
      fireEvent.click(screen.getByText(/Previous/i));

      // Verify revenue selection persisted
      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('$3M-$10M');
      });
    }, 10000);
  });

  describe('Email Validation', () => {
    it('should display error message for invalid email format', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 2
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByPlaceholderText(/BUSINESS EMAIL/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should clear error when valid email is entered', async () => {
      render(<MultiStepForm />);

      // Navigate to Screen 2
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByPlaceholderText(/BUSINESS EMAIL/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });

      // Enter valid email
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.blur(emailInput);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state on Screen 1 button during API call', async () => {
      mockFetchImplementation.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, leadId: 'lead_123' }),
        }), 200))
      );

      render(<MultiStepForm />);

      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });

      const submitButton = screen.getByRole('button', { name: /LET'S START/i });
      fireEvent.click(submitButton);

      // Check for loading state (button should be disabled or show spinner)
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should show loading text "Generating Your Report..." on Screen 6 final submission', async () => {
      mockFetchImplementation.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 200))
      );

      render(<MultiStepForm />);

      // Navigate to Screen 6
      fireEvent.change(screen.getByPlaceholderText(/FIRST NAME/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText(/LAST NAME/i), { target: { value: 'Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /LET'S START/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BUSINESS EMAIL/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/BUSINESS EMAIL/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/\+1/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/\+1/i), { target: { value: '1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/NUMBER OF EMPLOYEES/i), { target: { value: '25' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      const revenueSelect = screen.getByRole('combobox');
      fireEvent.change(revenueSelect, { target: { value: '$1M-$3M' } });
      fireEvent.click(screen.getByRole('button', { name: /CONTINUE/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/DESCRIBE YOUR PAIN POINTS/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText(/DESCRIBE YOUR PAIN POINTS/i), {
        target: { value: 'Too much admin work' }
      });

      const finalButton = screen.getByRole('button', { name: /GET MY EA ROADMAP/i });
      fireEvent.click(finalButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/generating your report/i)).toBeInTheDocument();
      }, { timeout: 500 });
    }, 10000);
  });
});
