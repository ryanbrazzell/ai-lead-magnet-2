/**
 * useUtmTracking Hook
 *
 * React hook that captures UTM parameters from the landing URL and
 * persists them through the multi-step form so they can be attached to
 * the Close lead record on submission.
 *
 * Lifecycle:
 * - On first mount, read `window.location.search` and parse UTMs
 * - If any present, merge with any existing sessionStorage values
 *   (first-click-wins within a session — we don't let a later navigation
 *   overwrite the UTMs the user actually arrived with)
 * - Return the merged set so form submission can include them
 */

'use client';

import { useEffect, useState } from 'react';
import {
  parseUtmParams,
  hasAnyUtm,
  UTM_KEYS,
  type UtmParams,
  type UtmKey,
} from '@/lib/tracking/utm-params';

const STORAGE_KEY = 'al_utm_params_v1';

interface UtmTrackingValues {
  utm: UtmParams;
  isReady: boolean;
}

function readFromSession(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const out: UtmParams = {};
      for (const key of UTM_KEYS) {
        const v = parsed[key];
        if (typeof v === 'string' && v) out[key] = v;
      }
      return out;
    }
  } catch {
    // Ignore — sessionStorage can throw in private browsing or when disabled
  }
  return {};
}

function writeToSession(value: UtmParams): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore — sessionStorage can be unavailable
  }
}

/**
 * Get UTM params from the URL, merge with any stored values, and persist.
 *
 * First-click-wins: if session already has utm_source=klaviyo from the
 * initial landing and the user navigates internally to a URL without
 * UTMs, we keep the original. If they arrive with a NEW set of UTMs
 * (different source), the new set replaces the old.
 */
export function useUtmTracking(): UtmTrackingValues {
  const [state, setState] = useState<UtmTrackingValues>({
    utm: {},
    isReady: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fromUrl = parseUtmParams(window.location.search);
    const fromSession = readFromSession();

    let merged: UtmParams;
    if (hasAnyUtm(fromUrl)) {
      // New UTMs on this landing - they win (this is a fresh attribution)
      merged = fromUrl;
      writeToSession(merged);
    } else {
      // No UTMs in URL - preserve whatever was captured earlier this session
      merged = fromSession;
    }

    setState({ utm: merged, isReady: true });
  }, []);

  return state;
}
