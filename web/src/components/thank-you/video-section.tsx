/**
 * VideoSection
 * Vidalytics-hosted VSL for the /report?v=video variation.
 * - CTA-on-pause, mid-roll CTAs, and Smart Autoplay are configured in the
 *   Vidalytics dashboard (no code config).
 * - We listen to the Player API and fire Meta Pixel custom events
 *   (VideoStart / Video25 / Video50 / Video75 / VideoComplete / VideoCTAClick)
 *   so retargeting can segment on engagement.
 */

"use client";

import * as React from 'react';

interface VideoSectionProps {
  /** Raw Vidalytics embed ID (the part after "vidalytics_embed_"). */
  embedId: string;
  /** Vidalytics account shard, the segment in the player URL. */
  shard: string;
  /** When true, render only the player (no heading, transparent bg, less padding) - used by the video variation where the player sits inside the hero blue section. */
  inline?: boolean;
}

// Bare-minimum types for the Vidalytics globals we touch. Vidalytics ships no
// official types and the player API surface is intentionally narrow here.
type VidalyticsPlayer = {
  on(event: string, handler: () => void): void;
  off(event: string, handler: () => void): void;
  currentTime(): number;
  duration(): number;
};

interface VidalyticsGlobals {
  _vidalytics?: {
    embeds?: Record<string, { player?: VidalyticsPlayer }>;
  };
  fbq?: (...args: unknown[]) => void;
}

/**
 * Resolve the player instance for a given embed ID. Vidalytics' player.min.js
 * assigns to `window._vidalytics.embeds[embedId].player` once initialized; we
 * intercept that assignment via a property descriptor so callers can await it
 * regardless of when the script finishes loading.
 */
function getPlayer(domId: string): Promise<VidalyticsPlayer> {
  return new Promise((resolve) => {
    const w = window as unknown as VidalyticsGlobals;
    w._vidalytics = w._vidalytics ?? {};
    w._vidalytics.embeds = w._vidalytics.embeds ?? {};
    const slot = (w._vidalytics.embeds[domId] = w._vidalytics.embeds[domId] ?? {});
    if (slot.player) {
      resolve(slot.player);
      return;
    }
    let p: VidalyticsPlayer | undefined;
    Object.defineProperty(slot, 'player', {
      configurable: true,
      get: () => p,
      set: (v: VidalyticsPlayer) => {
        p = v;
        resolve(v);
      },
    });
  });
}

/**
 * Vidalytics bootstrap, translated verbatim from their embed snippet. Loads
 * loader.min.js then player.min.js, then attaches the player to the div with
 * id `domId`. Safe to call once per mount; we gate at the caller.
 */
function bootstrapVidalytics(domId: string, embedId: string, shard: string): void {
  type Bootstrap = {
    [key: string]: unknown;
    Vidalytics?: { Embed?: new () => { run: (id: string) => void } };
    VidalyticsL?: { Loader?: new () => { loadScript: (u: string, cb: () => void) => void }; LoaderScript?: (u: string, cb: () => void) => void };
    _vidalytics?: { Loader?: { loadScript: (u: string, cb: () => void) => void } };
  };
  const v = window as unknown as Bootstrap;
  const d = 'Vidalytics' as const;
  const c = 'VidalyticsL' as const;
  const y = '_vidalytics' as const;
  v[d] = v[d] ?? {};
  v[c] = v[c] ?? {};
  v[y] = v[y] ?? {};

  const loaderUrl = `https://fast.vidalytics.com/embeds/${shard}/${embedId}/`;
  const head = document.getElementsByTagName('head')[0];

  let scriptLoaded = !!v[c]!.LoaderScript;
  const loadScript = v[c]!.LoaderScript ?? function (u: string, cb: () => void) {
    if (scriptLoaded) { cb(); return; }
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = u;
    s.onload = () => { scriptLoaded = true; cb(); };
    head.appendChild(s);
  };
  v[c]!.LoaderScript = loadScript;

  loadScript(loaderUrl + 'loader.min.js', () => {
    if (!v[y]!.Loader) {
      const LoaderCtor = v[c]!.Loader!;
      v[y]!.Loader = new LoaderCtor();
    }
    v[y]!.Loader!.loadScript(loaderUrl + 'player.min.js', () => {
      const EmbedCtor = v[d]!.Embed!;
      const embed = new EmbedCtor();
      embed.run(domId);
    });
  });
}

export function VideoSection({ embedId, shard, inline = false }: VideoSectionProps) {
  const domId = `vidalytics_embed_${embedId}`;
  const bootstrappedRef = React.useRef(false);
  const milestones = React.useRef({ q25: false, q50: false, q75: false });

  // Bootstrap the Vidalytics player once the div is mounted.
  React.useEffect(() => {
    if (bootstrappedRef.current) return;
    const div = document.getElementById(domId);
    if (!div) return;
    // If a previous mount already rendered the player into this div, skip.
    if (div.children.length > 0) return;
    bootstrappedRef.current = true;
    bootstrapVidalytics(domId, embedId, shard);
  }, [domId, embedId, shard]);

  // Wire Player API events to Meta Pixel custom events.
  React.useEffect(() => {
    let player: VidalyticsPlayer | null = null;
    let cancelled = false;

    const fire = (event: string) => {
      const w = window as unknown as VidalyticsGlobals;
      w.fbq?.('trackCustom', event);
    };

    const onPlay = () => fire('VideoStart');
    const onEnded = () => fire('VideoComplete');
    const onCtaClick = () => fire('VideoCTAClick');
    const onTime = () => {
      if (!player) return;
      const t = player.currentTime();
      const d = player.duration();
      if (!d) return;
      const pct = (t / d) * 100;
      if (pct >= 25 && !milestones.current.q25) { milestones.current.q25 = true; fire('Video25'); }
      if (pct >= 50 && !milestones.current.q50) { milestones.current.q50 = true; fire('Video50'); }
      if (pct >= 75 && !milestones.current.q75) { milestones.current.q75 = true; fire('Video75'); }
    };

    getPlayer(domId).then((p) => {
      if (cancelled) return;
      player = p;
      p.on('play', onPlay);
      p.on('timeupdate', onTime);
      p.on('ended', onEnded);
      p.on('cta:click', onCtaClick);
    });

    return () => {
      cancelled = true;
      if (!player) return;
      player.off('play', onPlay);
      player.off('timeupdate', onTime);
      player.off('ended', onEnded);
      player.off('cta:click', onCtaClick);
    };
  }, [domId]);

  return (
    <section
      style={{
        background: inline ? 'transparent' : 'white',
        padding: inline ? '0 0 24px' : '60px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* Header - hidden in inline mode (the hero supplies the framing) */}
        {!inline && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '28px',
              marginBottom: '12px',
              color: '#0f172a',
            }}
          >
            How 1,300+ founders escaped the admin trap
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              color: '#475569',
              marginBottom: '32px',
            }}
          >
            3 minutes that could save you 500+ hours this year
          </p>
        </div>
        )}

        {/* Vidalytics player */}
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            id={domId}
            style={{ width: '100%', position: 'relative', paddingTop: '64.63%' }}
          />
        </div>
      </div>
    </section>
  );
}
