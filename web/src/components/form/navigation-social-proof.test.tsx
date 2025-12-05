/**
 * Navigation and Social Proof Components Tests
 * Task Group 5: Tests for StepNavigation and SocialProof components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepNavigation } from './step-navigation';
import { SocialProof } from './social-proof';

describe('StepNavigation Component', () => {
  it('renders "Previous" link with left arrow icon', () => {
    const handlePrevious = vi.fn();
    render(<StepNavigation currentStep={1} onPrevious={handlePrevious} />);

    // Check that Previous text is rendered
    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeInTheDocument();

    // Check that the ArrowLeft icon is present (rendered as SVG)
    const svg = previousButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('is hidden on first step (step === 0)', () => {
    const handlePrevious = vi.fn();
    const { container } = render(
      <StepNavigation currentStep={0} onPrevious={handlePrevious} />
    );

    // Component should not render anything when on step 0
    expect(container.firstChild).toBeNull();

    // Previous button should not be in the document
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });
});

describe('SocialProof Component', () => {
  it('renders two checkmark items in purple (text-primary)', () => {
    render(
      <SocialProof
        speedPromise="Get Your Roadmap in Less than 30 Seconds"
        socialCount="Requested by over 250,000 Business Owners"
        consentText="By providing your information..."
      />
    );

    // Check that both text items are rendered
    expect(screen.getByText(/Get Your Roadmap in Less than 30 Seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Requested by over 250,000 Business Owners/)).toBeInTheDocument();

    // Check that checkmark icons are rendered (2 SVGs for the checkmarks)
    const checkmarks = screen.getAllByTestId('social-proof-checkmark');
    expect(checkmarks).toHaveLength(2);

    // Verify checkmarks have the text-primary class (purple color)
    checkmarks.forEach((checkmark) => {
      expect(checkmark).toHaveClass('text-primary');
    });
  });

  it('renders consent text in small gray styling', () => {
    const consentText = 'By providing your information today, you are giving consent...';
    render(
      <SocialProof
        speedPromise="Get Your Roadmap in Less than 30 Seconds"
        socialCount="Requested by over 250,000 Business Owners"
        consentText={consentText}
      />
    );

    // Check that consent text is rendered
    const consentElement = screen.getByText(consentText);
    expect(consentElement).toBeInTheDocument();

    // Verify it has the small gray text styling
    expect(consentElement).toHaveClass('text-xs');
    expect(consentElement).toHaveClass('text-gray-500');
  });
});
