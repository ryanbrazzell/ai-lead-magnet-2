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

    // Get both values
    const { fbc, fbp } = getMetaTrackingValues();

    setValues({
      fbc,
      fbp,
      isReady: true,
    });
  }, []);

  return values;
}
