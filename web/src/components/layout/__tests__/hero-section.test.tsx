/**
 * HeroSection Component Tests
 *
 * Task 3.1: 4 focused tests for HeroSection functionality
 *
 * Tests validate:
 * 1. Headline text renders with correct styling (text-question design token)
 * 2. Image placeholder renders with alt text
 * 3. Responsive layout (row on desktop, stack on mobile)
 * 4. Optional subheadline renders when provided
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '../hero-section';

describe('HeroSection Component', () => {
  /**
   * Test 1: Headline text renders with correct styling
   *
   * The headline should use the text-question class (32px, bold)
   * and support JSX with <strong> tags for keyword emphasis.
   */
  it('headline text renders with correct styling using text-question design token', () => {
    render(
      <HeroSection
        headline={
          <>
            Get Your Free <strong>Personalized</strong> Report
          </>
        }
      />
    );

    const headlineElement = screen.getByTestId('hero-headline');
    expect(headlineElement).toBeInTheDocument();

    // Check for text-question class (32px font size, bold)
    expect(headlineElement).toHaveClass('text-question');

    // Check that JSX with strong tag is rendered
    const strongElement = headlineElement.querySelector('strong');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement).toHaveTextContent('Personalized');
  });

  /**
   * Test 2: Image placeholder renders with alt text
   *
   * When imageSrc and imageAlt are provided, an img element should render.
   * When no imageSrc is provided, a placeholder div with border should render.
   */
  it('image placeholder renders with alt text when imageSrc provided', () => {
    const { rerender } = render(
      <HeroSection
        headline="Test Headline"
        imageSrc="/test-image.png"
        imageAlt="Test product mockup"
      />
    );

    // Check image renders with correct alt text
    const imageElement = screen.getByAltText('Test product mockup');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', '/test-image.png');

    // Rerender without imageSrc to test placeholder
    rerender(<HeroSection headline="Test Headline" />);

    // Check placeholder div renders when no image
    const placeholder = screen.getByTestId('hero-image-placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass('border');
  });

  /**
   * Test 3: Responsive layout (row on desktop, stack on mobile)
   *
   * The HeroSection should use:
   * - Mobile: flex-col (stacked layout - text above, image below)
   * - Desktop (md:+): md:flex-row (row layout - text left, image right)
   */
  it('responsive layout uses flex-col on mobile and md:flex-row on desktop', () => {
    render(
      <HeroSection
        headline="Test Headline"
        imageSrc="/test-image.png"
        imageAlt="Test mockup"
      />
    );

    const layoutContainer = screen.getByTestId('hero-layout');
    expect(layoutContainer).toBeInTheDocument();

    // Check for responsive flex classes
    expect(layoutContainer).toHaveClass('flex');
    expect(layoutContainer).toHaveClass('flex-col');
    expect(layoutContainer.className).toMatch(/md:flex-row/);

    // Check for responsive gap
    expect(layoutContainer.className).toMatch(/gap-8|gap-12/);
  });

  /**
   * Test 4: Optional subheadline renders when provided
   *
   * The subheadline should render below the main headline
   * with smaller font size and muted color.
   */
  it('optional subheadline renders when provided', () => {
    const { rerender } = render(
      <HeroSection
        headline="Main Headline"
        subheadline="This is the subheadline text"
      />
    );

    // Check subheadline renders
    const subheadlineElement = screen.getByTestId('hero-subheadline');
    expect(subheadlineElement).toBeInTheDocument();
    expect(subheadlineElement).toHaveTextContent('This is the subheadline text');

    // Check for smaller font size (text-lg or text-xl)
    expect(subheadlineElement.className).toMatch(/text-lg|text-xl/);

    // Check for muted color
    expect(subheadlineElement.className).toMatch(/text-gray-|text-muted/);

    // Rerender without subheadline
    rerender(<HeroSection headline="Main Headline" />);

    // Subheadline should not be present
    expect(screen.queryByTestId('hero-subheadline')).not.toBeInTheDocument();
  });
});
