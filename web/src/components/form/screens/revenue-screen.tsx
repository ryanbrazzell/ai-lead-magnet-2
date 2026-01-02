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
  { value: 'Under $500k', label: 'Under $500,000' },
  { value: '$500k-$1M', label: '$500,000 to $1,000,000' },
  { value: '$1M-$5M', label: '$1,000,000 to $4,999,999' },
  { value: '$5M-$10M', label: '$5,000,000 to $9,999,999' },
  { value: 'Over $10M', label: 'Over $10,000,000' },
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
