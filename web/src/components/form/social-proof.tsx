/**
 * SocialProof Component
 * Task Group 5: Social proof and consent component for forms
 *
 * Displays two sparkle bullet items (speed promise and social proof number)
 * with consent/legal text below. Positioned below the form on every step.
 */

export interface SocialProofProps {
  /** Speed promise text (e.g., "Get Your Roadmap in Less than 30 Seconds") */
  speedPromise: string;
  /** Social proof count text (e.g., "Requested by over 250,000 Business Owners") */
  socialCount: string;
  /** Consent/legal text to display below bullets */
  consentText: string;
}

/**
 * SocialProof displays trust indicators and legal consent text.
 *
 * Design specifications:
 * - Sparkle emojis as bullet icons (matching Acquisition.com)
 * - Bullet items: flex items-center gap-2
 * - Consent text: text-xs text-gray-500
 * - Persistent positioning below form on every step
 */
export function SocialProof({
  speedPromise,
  socialCount,
  consentText,
}: SocialProofProps) {
  // VERIFICATION REQUIRED: Compare spacing with https://acquisition.com/roadmap in browser
  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {/* Social proof bullet items */}
      <div className="flex flex-col items-center gap-2">
        {/* Speed promise */}
        <div className="flex items-center gap-2">
          <span
            className="text-lg flex-shrink-0"
            data-testid="social-proof-icon"
            aria-hidden="true"
          >
            ✨
          </span>
          <span className="text-base text-gray-900 font-semibold">
            {speedPromise}
          </span>
        </div>

        {/* Social proof count */}
        <div className="flex items-center gap-2">
          <span
            className="text-lg flex-shrink-0"
            data-testid="social-proof-icon"
            aria-hidden="true"
          >
            ✨
          </span>
          <span className="text-base text-gray-900 font-semibold">
            {socialCount}
          </span>
        </div>
      </div>

    </div>
  );
}
