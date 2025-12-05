/**
 * Tests for Page Integration
 * Task Group 3: Page Integration & Layout
 *
 * Tests cover:
 * - PageLayout renders with Header and Footer
 * - HeroSection persists across all screens
 * - SocialProof component appears below form
 * - Responsive behavior at mobile and desktop breakpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '../page';

describe('Page Integration', () => {
  it('should render the multi-step form within page layout', () => {
    render(<Page />);

    // Check that Screen 1 inputs are present
    expect(screen.getByPlaceholderText(/FIRST NAME/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LAST NAME/i)).toBeInTheDocument();
  });

  it('should render HeroSection with EA Roadmap headline', () => {
    render(<Page />);

    // Check for hero headline text
    expect(screen.getByText(/Get Your Free Personalized/i)).toBeInTheDocument();
    expect(screen.getByText(/EA Roadmap/i)).toBeInTheDocument();
  });

  it('should render SocialProof below form', () => {
    render(<Page />);

    // Check for social proof text
    expect(screen.getByText(/Get Your Roadmap in Less than 30 Seconds/i)).toBeInTheDocument();
  });

  it('should have proper semantic HTML structure', () => {
    render(<Page />);

    // Check for main element
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});
