/**
 * Tests for root page layout
 * Task Group 4.1: Focused tests for page layout
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock the FormStep1 component
vi.mock('@/components/form/form-step1', () => ({
  FormStep1: () => <div data-testid="form-step1">FormStep1 Mock</div>,
}));

// Mock the sendToZapier function
vi.mock('@/lib/zapier', () => ({
  sendToZapier: vi.fn(() => Promise.resolve()),
}));

describe('Home Page', () => {
  it('should render PageLayout wrapper', () => {
    render(<Home />);

    // PageLayout includes a main element
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('should render FormLayout with max-width constraint', () => {
    render(<Home />);

    // FormLayout has a specific data-testid
    const formLayout = screen.getByTestId('form-layout-container');
    expect(formLayout).toBeInTheDocument();
    expect(formLayout).toHaveClass('max-w-form');
  });

  it('should render FormStep1 component', () => {
    render(<Home />);

    // FormStep1 should be present
    const formStep1 = screen.getByTestId('form-step1');
    expect(formStep1).toBeInTheDocument();
  });

  it('should render SocialProof below form', () => {
    render(<Home />);

    // SocialProof has checkmark icons with specific test-id
    const checkmarks = screen.getAllByTestId('social-proof-checkmark');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('should have responsive layout classes', () => {
    render(<Home />);

    const formLayout = screen.getByTestId('form-layout-container');

    // Check for responsive padding classes
    expect(formLayout.className).toMatch(/px-/); // horizontal padding
    expect(formLayout.className).toMatch(/py-/); // vertical padding
  });
});
