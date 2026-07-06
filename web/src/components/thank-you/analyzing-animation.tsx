/**
 * AnalyzingAnimation Component
 * Shows "analyzing your responses..." animation for a few seconds
 * Builds anticipation and makes results feel personalized
 */

"use client";

import * as React from "react";
import { Sparkles, Brain, ChartBar, CheckCircle } from "lucide-react";

interface AnalyzingAnimationProps {
  firstName?: string;
  onComplete: () => void;
  duration?: number; // ms
}

const stages = [
  { icon: Brain, text: "Analyzing your responses...", color: "text-blue-500" },
  { icon: ChartBar, text: "Calculating time savings...", color: "text-blue-600" },
  { icon: Sparkles, text: "Generating your ROI analysis...", color: "text-amber-500" },
  { icon: CheckCircle, text: "Your results are ready!", color: "text-green-500" },
];

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function AnalyzingAnimation({
  firstName = "there",
  onComplete,
  duration = 3000,
}: AnalyzingAnimationProps) {
  const displayName = capitalizeFirst(firstName);
  const [currentStage, setCurrentStage] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const stageInterval = duration / stages.length;
    const progressInterval = 50; // Update progress every 50ms
    const progressStep = 100 / (duration / progressInterval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(prev + progressStep, 100));
    }, progressInterval);

    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stageInterval);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration + 500); // Extra 500ms to show final state

    return () => {
      clearInterval(progressTimer);
      clearInterval(stageTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  const CurrentIcon = stages[currentStage].icon;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
        background: '#f1f5f9',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Animated icon */}
        <div
          style={{
            position: 'relative',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              margin: '0 auto',
              borderRadius: '50%',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CurrentIcon
              style={{
                width: '48px',
                height: '48px',
                color: '#f59e0b',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          </div>
          {/* Spinning ring */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '96px',
              height: '96px',
            }}
          >
            <svg
              style={{
                width: '100%',
                height: '100%',
                animation: 'spin 3s linear infinite',
              }}
            >
              <circle
                cx="48"
                cy="48"
                r="46"
                stroke="#1e293b"
                strokeWidth="2"
                fill="none"
                strokeDasharray="289"
                strokeDashoffset="72"
              />
            </svg>
          </div>
        </div>

        {/* Status text */}
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
            fontSize: '28px',
            fontWeight: 400,
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          {displayName}, hold tight...
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
            fontSize: '18px',
            color: '#475569',
            fontWeight: 500,
            marginBottom: '24px',
            transition: 'color 0.3s',
          }}
        >
          {stages[currentStage].text}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              height: '8px',
              background: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                transition: 'width 0.1s ease-out',
                borderRadius: '4px',
                width: `${progress}%`,
              }}
            />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#475569',
              marginTop: '8px',
            }}
          >
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Stage indicators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
          }}
        >
          {stages.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                transition: 'background-color 0.3s',
                backgroundColor: index <= currentStage ? '#0f172a' : '#cbd5e1',
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
