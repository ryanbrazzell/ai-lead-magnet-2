/**
 * PainPointsScreen - Screen 6
 * Collects pain points, final submission
 */

"use client";

import * as React from 'react';
import { FormTextarea } from '@/components/ui/form-textarea';
import { PillButton } from '@/components/ui/pill-button';
import { PreviousLink } from './previous-link';

interface PainPointsScreenProps {
  painPoints: string;
  isLoading: boolean;
  onPainPointsChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (painPoints: string) => Promise<void>;
}

export function PainPointsScreen({
  painPoints,
  isLoading,
  onPainPointsChange,
  onPrevious,
  onSubmit,
}: PainPointsScreenProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(painPoints);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-question text-center">
        Where are you and your team <strong>stuck in the weeds</strong> the most?
      </h2>

      <FormTextarea
        placeholder="Describe your pain points..."
        value={painPoints}
        onChange={(e) => onPainPointsChange(e.target.value)}
        id="painPoints"
        rows={5}
      />

      <div className="flex justify-center">
        <PillButton type="submit" variant="primary" loading={isLoading}>
          {isLoading ? 'GENERATING YOUR REPORT...' : 'GET MY EA ROADMAP'}
        </PillButton>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
