/**
 * PreviousLink Component
 *
 * A text link with left arrow icon for backward navigation
 */

import * as React from 'react';
import { ChevronLeft } from 'lucide-react';

interface PreviousLinkProps {
  onClick: () => void;
}

export function PreviousLink({ onClick }: PreviousLinkProps) {
  return (
    <div className="flex justify-center mt-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--color-secondary)] transition-colors duration-200 hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>
    </div>
  );
}
