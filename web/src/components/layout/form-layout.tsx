/**
 * FormLayout Component
 * Task Group 4: FormLayout Component for form pages
 *
 * A centered container for form step content that includes
 * persistent SocialProof component below the form.
 *
 * Design specifications:
 * - Centered form container using `max-w-form` (650px) design token
 * - Automatic horizontal centering with `mx-auto`
 * - Generous vertical padding (py-8 to py-16)
 * - Full width on mobile, constrained on larger screens
 * - Persistent SocialProof rendered below form content
 *
 * This component does NOT include Header/Footer - it is designed
 * to be composed inside PageLayout.
 *
 * @see /boundless-os/specs/2025-12-01-shared-layout/spec.md
 */

import * as React from 'react';
import { SocialProof } from '@/components/form/social-proof';
import { cn } from '@/lib/utils';

/** Default consent text for SocialProof component */
const DEFAULT_CONSENT_TEXT =
  'By submitting this form, you agree to receive marketing communications from us. You can unsubscribe at any time. We respect your privacy and will never share your information.';

export interface FormLayoutProps {
  /**
   * Form step content to render within the container
   */
  children: React.ReactNode;

  /**
   * Speed promise text for SocialProof component
   * @default "Get Your Report in Less than 60 Seconds"
   */
  speedPromise?: string;

  /**
   * Social proof count text for SocialProof component
   * @default "Trusted by Business Owners Worldwide"
   */
  socialCount?: string;

  /**
   * Consent/legal text for SocialProof component
   * @default (standard consent language)
   */
  consentText?: string;

  /**
   * Whether to show the SocialProof component
   * @default true
   */
  showSocialProof?: boolean;

  /**
   * Additional className to merge with default styles
   */
  className?: string;
}

/**
 * FormLayout provides a centered container for form content with SocialProof.
 *
 * Features:
 * - Max-width of 650px using max-w-form design token
 * - Centered horizontally with mx-auto
 * - Generous vertical padding
 * - Integrated SocialProof with configurable props
 *
 * @example
 * // Basic usage with default SocialProof
 * <FormLayout>
 *   <FormStep1 />
 * </FormLayout>
 *
 * @example
 * // With custom SocialProof text
 * <FormLayout
 *   speedPromise="Get Your Results in 30 Seconds"
 *   socialCount="Join 500,000+ Users"
 * >
 *   <FormStep1 />
 * </FormLayout>
 *
 * @example
 * // Without SocialProof
 * <FormLayout showSocialProof={false}>
 *   <SpecialFormContent />
 * </FormLayout>
 */
export function FormLayout({
  children,
  speedPromise = 'Get Your Report in Less than 60 Seconds',
  socialCount = 'Trusted by Business Owners Worldwide',
  consentText = DEFAULT_CONSENT_TEXT,
  showSocialProof = true,
  className,
}: FormLayoutProps) {
  return (
    <div
      data-testid="form-layout-container"
      className={cn(
        // Max-width using design token (650px)
        'max-w-form',
        // Centered horizontally
        'mx-auto',
        // Full width on mobile (within max-width constraint)
        'w-full',
        // VERIFICATION REQUIRED: Compare spacing with https://acquisition.com/roadmap in browser
        // Tighter vertical padding to match acquisition.com/roadmap (py-2 = 8px, py-3 = 12px)
        'py-2 md:py-3',
        // Horizontal padding for mobile edge spacing
        'px-4 sm:px-6',
        // Additional classes
        className
      )}
    >
      {/* Form step content */}
      {children}

      {/* SocialProof component below form content */}
      {showSocialProof && (
        <SocialProof
          speedPromise={speedPromise}
          socialCount={socialCount}
          consentText={consentText}
        />
      )}
    </div>
  );
}

FormLayout.displayName = 'FormLayout';
