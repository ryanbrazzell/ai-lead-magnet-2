/**
 * ConfirmationBanner Component
 * Teal banner showing confirmation message at top of thank-you page
 */

"use client";

import { CheckCircle } from 'lucide-react';

interface ConfirmationBannerProps {
  message: string;
}

export function ConfirmationBanner({ message }: ConfirmationBannerProps) {
  return (
    <div className="bg-teal-500 text-white py-3 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm md:text-base font-medium">
          ✓ Confirmed: {message}
        </span>
      </div>
    </div>
  );
}

