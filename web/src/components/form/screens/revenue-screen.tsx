/**
 * RevenueScreen - Screen 5
 * Collects annual revenue range, updates lead in Close CRM
 */

"use client";

import * as React from 'react';
import { FormInput } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validateSelection } from '@/lib/form-validation';
import { PreviousLink } from './previous-link';

interface RevenueScreenProps {
  revenue: string;
  error?: string;
  isLoading: boolean;
  onRevenueChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (revenue: string) => Promise<void>;
}

const revenueOptions = [
  { value: 'Under $100k', label: 'Under $100k' },
  { value: '$100k-$250k', label: '$100k - $250k' },
  { value: '$250k-$500k', label: '$250k - $500k' },
  { value: '$500k-$1M', label: '$500k - $1M' },
  { value: '$1M-$3M', label: '$1M - $3M' },
  { value: '$3M-$10M', label: '$3M - $10M' },
  { value: '$10M-$30M', label: '$10M - $30M' },
  { value: '$30M+', label: '$30M+' },
];

export function RevenueScreen({
  revenue,
  error,
  isLoading,
  onRevenueChange,
  onPrevious,
  onSubmit,
}: RevenueScreenProps) {
  const [localError, setLocalError] = React.useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const revenueError = validateSelection(revenue, 'your revenue range');
    if (revenueError) {
      setLocalError(revenueError);
      return;
    }

    setLocalError(undefined);
    await onSubmit(revenue);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-question text-center">
        What is your <strong>annual business revenue</strong>?
      </h2>

      <FormInput
        type="select"
        placeholder="Select Revenue Range"
        options={revenueOptions}
        selectValue={revenue}
        onSelectChange={onRevenueChange}
        error={localError || error}
        id="revenue"
      />

      <div className="flex justify-center">
        <PillButton type="submit" variant="progress" loading={isLoading}>
          CONTINUE
        </PillButton>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
