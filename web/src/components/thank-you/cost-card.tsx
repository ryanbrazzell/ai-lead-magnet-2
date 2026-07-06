/**
 * CostCard Component
 * Shows time lost calculation and ROI breakdown
 * Card overlaps the hero section
 * Matches lead-magnet-reference.html exactly
 */

"use client";

import * as React from 'react';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';

interface CostCardProps {
  taskHours: TaskHours;
  revenueRange: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Inline video embed component
function VideoEmbed({ videoUrl }: { videoUrl: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        aspectRatio: '16/9',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {isPlaying ? (
        <iframe
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1&showinfo=0`}
          title="EA Workshop Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={() => setIsPlaying(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
          }}
          aria-label="Play video"
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="#0f172a"
              style={{
                width: '32px',
                height: '32px',
                marginLeft: '4px',
              }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}

// Easing function for slot machine effect - slow start, fast middle, slow end
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CostCard({ taskHours, revenueRange }: CostCardProps) {
  const roi = calculateROI(taskHours, revenueRange);
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  const annualHours = totalWeeklyHours * 52;
  const workWeeks = Math.round(annualHours / 40);

  // Animated net return value
  const [animatedNetReturn, setAnimatedNetReturn] = React.useState(0);
  const [animatedROI, setAnimatedROI] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(true);

  // Slot machine animation over 10 seconds
  React.useEffect(() => {
    const duration = 10000; // 10 seconds
    const startTime = Date.now();
    const targetValue = roi.netReturn;
    const targetROI = roi.roiMultiplier;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing for slot machine feel
      const easedProgress = easeOutExpo(progress);

      // Calculate current animated value
      const currentValue = Math.round(easedProgress * targetValue);
      const currentROI = easedProgress * targetROI;

      setAnimatedNetReturn(currentValue);
      setAnimatedROI(currentROI);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [roi.netReturn, roi.roiMultiplier]);

  return (
    <div
      className="cost-card-wrapper"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px',
      }}
    >
      <div
        className="cost-card-inner"
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(24px, 5vw, 40px)',
          margin: '-40px auto 40px',
          maxWidth: '600px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#475569',
              marginBottom: '8px',
            }}
          >
            Based on your answers
          </h2>
          <div
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: '32px',
              color: '#f59e0b',
            }}
          >
            Here&apos;s what this is costing <span style={{ textDecoration: 'underline' }}>you</span>
          </div>
        </div>

        {/* Time Lost Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '24px',
            border: '2px solid #f59e0b',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#0f172a',
              opacity: 0.7,
              marginBottom: '8px',
            }}
          >
            Hours you&apos;re losing every week to low-value tasks
          </p>
          <div
            className="hours-number"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(40px, 10vw, 64px)',
              color: '#0f172a',
              lineHeight: 1,
            }}
          >
            {totalWeeklyHours}+
          </div>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '20px',
              color: '#0f172a',
              opacity: 0.8,
            }}
          >
            hours/week
          </p>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#475569',
              marginTop: '12px',
            }}
          >
            What would you do with an extra <strong>{annualHours}+ hours</strong> ({workWeeks} full work weeks) this year?
          </p>
        </div>

        {/* Net Return Calculation - Integrated in Grey Section */}
        <div
          style={{
            marginBottom: '24px',
          }}
        >
          {/* Calculation breakdown with Net Return integrated */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '24px',
              background: '#f1f5f9',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: 600,
                }}
              >
                What those hours cost you
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '20px',
                  color: '#ef4444',
                }}
              >
                {formatCurrency(roi.annualRevenueUnlocked)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: 600,
                }}
              >
                What an EA costs
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: '20px',
                  color: '#0f172a',
                }}
              >
                &lt;3k/month
              </span>
            </div>
            <div
              style={{
                height: '1px',
                background: '#cbd5e1',
                margin: '4px 0',
              }}
            />
            {/* Net Return - Integrated but Standout */}
            <div
              style={{
                padding: '16px',
                background: '#0f172a',
                borderRadius: '8px',
                marginTop: '4px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '12px',
                  color: '#ffffff',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Your Net Return on an Assistant
              </p>
              <div
                className="net-return-value"
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
                  fontSize: 'clamp(28px, 8vw, 36px)',
                  color: '#10b981',
                  lineHeight: 1,
                  marginBottom: '8px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{formatCurrency(animatedNetReturn)} <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', color: '#94a3b8' }}>this year</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                That&apos;s a {animatedROI.toFixed(1)}x ROI
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
