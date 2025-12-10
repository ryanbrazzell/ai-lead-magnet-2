/**
 * HeroSection Component
 * Task Group 3: HeroSection Component for landing pages
 *
 * Displays a large headline with optional product mockup image.
 * Supports bold keywords via JSX in the headline prop.
 *
 * Design specifications:
 * - Headline: text-question design token (32px, bold, line-height 1.2)
 * - Layout: flex-col on mobile, flex-row on desktop (md:+)
 * - Image: Right side on desktop, below text on mobile
 * - Optional subheadline with muted color
 */

import React from 'react';

export interface HeroSectionProps {
  /** Main headline - supports JSX for bold keywords (e.g., <>Get <strong>Free</strong> Report</>) */
  headline: React.ReactNode;
  /** Optional secondary copy below headline */
  subheadline?: string;
  /** Product mockup image source URL */
  imageSrc?: string;
  /** Alt text for product mockup image */
  imageAlt?: string;
}

/**
 * HeroSection displays a prominent headline with optional product mockup.
 *
 * Layout behavior:
 * - Always stacked layout (text above, image below) - matches acquisition.com/roadmap
 * - Image centered below header text on all screen sizes
 *
 * @example
 * <HeroSection
 *   headline={<>Get Your Free <strong>Personalized</strong> Report</>}
 *   subheadline="Discover insights in under 30 seconds"
 *   imageSrc="/product-mockup.png"
 *   imageAlt="Product mockup showing report"
 * />
 */
export function HeroSection({
  headline,
  subheadline,
  imageSrc,
  imageAlt = 'Product mockup',
}: HeroSectionProps) {
  return (
    <section
      className="w-full max-w-6xl mx-auto px-4 py-1 md:py-3"
      aria-label="Hero section"
    >
      {/* VERIFICATION REQUIRED: Compare spacing with https://acquisition.com/roadmap in browser */}
      <div
        data-testid="hero-layout"
        className="flex flex-col items-center gap-2 md:gap-3"
      >
        {/* Text content - centered above image */}
        <div className="w-full text-center">
          <h1
            data-testid="hero-headline"
            className="text-hero text-foreground tracking-tight font-serif"
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            }}
          >
            {headline}
          </h1>

          {subheadline && (
            <p
              data-testid="hero-subheadline"
              className="text-lg md:text-xl text-gray-600 mt-4 font-semibold"
            >
              {subheadline}
            </p>
          )}
        </div>

        {/* Image slot - centered below text on all screen sizes, smaller size like acquisition.com/roadmap */}
        {imageSrc && (
          <div className="w-full flex justify-center px-4">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-[500px] w-full h-auto object-contain block"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}
