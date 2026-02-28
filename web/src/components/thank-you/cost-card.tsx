/**
 * CostCard Component
 * Napkin-math style cost calculation
 * Shows hourly rate × hours wasted = annual cost
 */

"use client";

import * as React from 'react';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';

interface CostCardProps {
  taskHours: TaskHours;
  revenueRange: string;
  onCTAClick?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Easing function for slot machine effect
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CostCard({ taskHours, revenueRange, onCTAClick }: CostCardProps) {
  const roi = calculateROI(taskHours, revenueRange);
  const totalWeeklyHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);

  // Animated net return value
  const [animatedNetReturn, setAnimatedNetReturn] = React.useState(0);
  const [animatedROI, setAnimatedROI] = React.useState(0);

  // Slot machine animation over 10 seconds
  React.useEffect(() => {
    const duration = 10000;
    const startTime = Date.now();
    const targetValue = roi.netReturn;
    const targetROI = roi.roiMultiplier;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setAnimatedNetReturn(Math.round(easedProgress * targetValue));
      setAnimatedROI(easedProgress * targetROI);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [roi.netReturn, roi.roiMultiplier]);

  const font = {
    sans: 'var(--font-dm-sans), "DM Sans", sans-serif',
    serif: 'var(--font-dm-serif), "DM Serif Display", serif',
  };

  return (
    <div
      className="cost-card-wrapper"
      style={{
        background: '#f1f5f9',
        padding: '0 20px 40px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(24px, 5vw, 40px)',
          margin: '24px auto 40px',
          maxWidth: '600px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: font.sans,
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
              fontFamily: font.serif,
              fontSize: 'clamp(24px, 6vw, 32px)',
              color: '#f59e0b',
            }}
          >
            You <span style={{ textDecoration: 'underline' }}>still</span> owning admin is costing you:
          </div>
        </div>

        {/* Napkin Math Equation */}
        <div
          style={{
            background: '#fafafa',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: '24px',
          }}
        >
          {/* Line 1: Hourly rate */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontFamily: font.sans, fontSize: '15px', color: '#475569' }}>
              Your effective hourly rate
            </span>
            <span
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(20px, 5vw, 28px)',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCurrency(roi.ceoHourlyRate)}/hr
            </span>
          </div>

          {/* Line 2: × hours wasted */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontFamily: font.sans, fontSize: '15px', color: '#475569' }}>
              <span style={{ color: '#94a3b8', marginRight: '6px' }}>&times;</span>
              Hours wasted per week
            </span>
            <span
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(20px, 5vw, 28px)',
                color: '#ef4444',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalWeeklyHours}+ hrs
            </span>
          </div>

          {/* Line 3: × 52 weeks */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontFamily: font.sans, fontSize: '15px', color: '#475569' }}>
              <span style={{ color: '#94a3b8', marginRight: '6px' }}>&times;</span>
              Weeks per year
            </span>
            <span
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(20px, 5vw, 28px)',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              52
            </span>
          </div>

          {/* Divider line (like napkin underline) */}
          <div
            style={{
              height: '2px',
              background: '#0f172a',
              marginBottom: '16px',
            }}
          />

          {/* Result: Annual cost */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: font.sans,
                fontSize: '15px',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              You&apos;re losing per year
            </span>
            <span
              style={{
                fontFamily: font.serif,
                fontSize: 'clamp(28px, 7vw, 40px)',
                color: '#ef4444',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {formatCurrency(roi.annualRevenueUnlocked)}
            </span>
          </div>
        </div>

        {/* Net Return - dark box */}
        <div
          style={{
            padding: '20px',
            background: '#0f172a',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: font.sans,
              fontSize: '12px',
              color: '#ffffff',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Your Net Return if You Had an Assistant
          </p>
          <div
            style={{
              fontFamily: font.serif,
              fontSize: 'clamp(28px, 8vw, 36px)',
              color: '#10b981',
              lineHeight: 1,
              marginBottom: '8px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{formatCurrency(animatedNetReturn)}{' '}
            <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', color: '#94a3b8' }}>this year</span>
          </div>
          <p
            style={{
              fontFamily: font.sans,
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

      {/* CTA Button */}
      {onCTAClick && (
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
            marginTop: '24px',
            paddingBottom: '40px',
          }}
        >
          <button
            onClick={onCTAClick}
            style={{
              fontFamily: font.sans,
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 32px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 32px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.2)';
            }}
          >
            Book your FREE Time Strategy Call
          </button>
        </div>
      )}
    </div>
  );
}
