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

export function AnalyzingAnimation({
  firstName = "there",
  onComplete,
  duration = 3000,
}: AnalyzingAnimationProps) {
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
            <CurrentIcon
              className={`w-12 h-12 ${stages[currentStage].color} animate-pulse`}
            />
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: "3s" }}>
              <circle
                cx="48"
                cy="48"
                r="46"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-blue-200"
                strokeDasharray="289"
                strokeDashoffset="72"
              />
            </svg>
          </div>
        </div>

        {/* Status text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {firstName}, hold tight...
        </h2>
        <p className={`text-lg ${stages[currentStage].color} font-medium mb-6 transition-colors duration-300`}>
          {stages[currentStage].text}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index <= currentStage ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
