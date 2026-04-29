/**
 * Footer Component
 * Task Group 2: Footer Component for Shared Layout Components
 *
 * A reusable footer component with purple background, white text,
 * placeholder links for Privacy Policy and Terms of Service,
 * and a configurable legal disclaimer text.
 *
 * Design specifications:
 * - Purple background using `bg-primary` (#6F00FF) design token
 * - Full-width with generous vertical padding (py-8 to py-12)
 * - White text for all content (`text-white`)
 * - Centered content with max-width container
 * - Mobile: Links stack vertically with 44px touch targets
 * - Desktop: Links display inline horizontally
 */

export interface FooterProps {
  /** URL for Privacy Policy link (default "#") */
  privacyHref?: string;
  /** URL for Terms of Service link (default "#") */
  termsHref?: string;
  /** Legal disclaimer text (default placeholder text if not provided) */
  disclaimer?: string;
}

/** Default disclaimer text used when no prop is provided */
const DEFAULT_DISCLAIMER =
  'Results are not typical and are not a guarantee of your success. Your results will vary depending on education, effort, application, experience, and background. We cannot guarantee that you will be successful. The information contained within this website is the property of this company. Any use of the images, content, or ideas expressed herein without the express written consent is prohibited.';

/**
 * Footer displays navigation links and legal disclaimer text.
 *
 * Features:
 * - Purple background (#6F00FF) using design token
 * - Privacy Policy and Terms of Service links
 * - Configurable legal disclaimer text
 * - Responsive layout (stacked on mobile, inline on desktop)
 * - Minimum 44px touch targets for accessibility
 */
export function Footer({
  privacyHref = '#',
  termsHref = '#',
  disclaimer = DEFAULT_DISCLAIMER,
}: FooterProps) {
  return (
    <footer className="w-full border-t border-dark-border bg-dark-bg py-10 text-dark-text md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Footer navigation"
          className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6"
        >
          <a
            href={privacyHref}
            className="min-h-11 flex items-center justify-center rounded-md px-2 text-dark-text/85 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-dark-bg)]"
          >
            Privacy Policy
          </a>
          <a
            href={termsHref}
            className="min-h-11 flex items-center justify-center rounded-md px-2 text-dark-text/85 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-dark-bg)]"
          >
            Terms of Service
          </a>
        </nav>

        <p
          data-testid="footer-disclaimer"
          className="mx-auto max-w-4xl px-4 text-center text-xs leading-relaxed text-dark-text/72 sm:text-sm"
        >
          {disclaimer}
        </p>
      </div>
    </footer>
  );
}
