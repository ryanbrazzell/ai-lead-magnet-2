/**
 * EmployeesScreen - Screen 4
 * Collects employee count, updates lead in Close CRM
 */

"use client";

import * as React from 'react';
import { FormInput } from '@/components/ui/form-input';
import { PillButton } from '@/components/ui/pill-button';
import { validatePositiveNumber } from '@/lib/form-validation';
import { PreviousLink } from './previous-link';

interface EmployeesScreenProps {
  employees: string;
  error?: string;
  isLoading: boolean;
  onEmployeesChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (employees: string) => Promise<void>;
}

export function EmployeesScreen({
  employees,
  error,
  isLoading,
  onEmployeesChange,
  onPrevious,
  onSubmit,
}: EmployeesScreenProps) {
  const [localError, setLocalError] = React.useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const employeeError = validatePositiveNumber(employees, 'Number of employees');
    if (employeeError) {
      setLocalError(employeeError);
      return;
    }

    setLocalError(undefined);
    await onSubmit(employees);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h2 className="text-question text-center">
        How many <strong>full-time employees</strong> do you have?
      </h2>

      <FormInput
        type="text"
        placeholder="Number of Employees"
        value={employees}
        onChange={(e) => onEmployeesChange(e.target.value)}
        error={localError || error}
        id="employees"
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
