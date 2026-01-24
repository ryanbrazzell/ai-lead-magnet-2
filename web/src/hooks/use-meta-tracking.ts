/**
 * useMetaTracking Hook
 *
 * React hook for accessing Meta (Facebook) tracking cookies
 * Ensures _fbc is created from fbclid on mount
 */

'use client';

import { useEffect, useState } from 'react';
import { getMetaTrackingValues, ensureFbc } from '@/lib/tracking/meta-cookies';

interface MetaTrackingValues {
  fbc: string | null;
  fbp: string | null;
  isReady: boolean;
}

/**
 * Hook to get Meta tracking values (_fbc and _fbp)
 *
 * - Ensures _fbc is created from fbclid URL param on mount
 * - Returns both _fbc and _fbp values for form submission
 *
 * @example
 * const { fbc, fbp, isReady } = useMetaTracking();
 *
 * // Use in form submission
 * const formData = {
 *   ...otherFields,
 *   meta_fbc: fbc,
 *   meta_fbp: fbp,
 * };
 */
export function useMetaTracking(): MetaTrackingValues {
  const [values, setValues] = useState<MetaTrackingValues>({
    fbc: null,
    fbp: null,
    isReady: false,
  });

  useEffect(() => {
    // Ensure _fbc is created from fbclid if present
    ensureFbc();

    // Get initial values
    const updateValues = () => {
      const { fbc, fbp } = getMetaTrackingValues();
      setValues({
        fbc,
        fbp,
        isReady: true,
      });
      return fbp;
    };

    // Try to get values immediately
    const initialFbp = updateValues();

    // If _fbp not available yet, poll for it (Meta Pixel creates it async)
    // The pixel typically sets _fbp within 1-2 seconds of loading
    if (!initialFbp) {
      let attempts = 0;
      const maxAttempts = 20; // Try for up to 10 seconds (20 * 500ms)

      const pollInterval = setInterval(() => {
        attempts++;
        const { fbp } = getMetaTrackingValues();

        if (fbp) {
          updateValues();
          clearInterval(pollInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }, 500);

      return () => clearInterval(pollInterval);
    }
  }, []);

  return values;
}
