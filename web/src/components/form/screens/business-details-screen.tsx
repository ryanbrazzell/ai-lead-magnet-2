/**
 * BusinessDetailsScreen - Screen 4 (Combined)
 * Collects employee count, revenue, and pain points all on one screen
 * Updated to match Acquisition.com styling with labels above dropdowns
 */

"use client";

import * as React from 'react';
import { FormTextarea } from '@/components/ui/form-textarea';
import { PillButton } from '@/components/ui/pill-button';
import { validateSelection } from '@/lib/form-validation';
import { PreviousLink } from './previous-link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessDetailsScreenProps {
  employees: string;
  revenue: string;
  painPoints: string;
  errors?: {
    employees?: string;
    revenue?: string;
  };
  isLoading: boolean;
  onEmployeesChange: (value: string) => void;
  onRevenueChange: (value: string) => void;
  onPainPointsChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (employees: string, revenue: string, painPoints: string) => Promise<void>;
}

const revenueOptions = [
  { value: '', label: 'Select...' },
  { value: 'Under $100k', label: 'Under $100k' },
  { value: '$100k to $250k', label: '$100k to $250k' },
  { value: '$250K to $500k', label: '$250K to $500k' },
  { value: '$500k to $1M', label: '$500k to $1M' },
  { value: '$1M to $3M', label: '$1M to $3M' },
  { value: '$3M to $10M', label: '$3M to $10M' },
  { value: '$10M to $30M', label: '$10M to $30M' },
  { value: '$30 Million+', label: '$30 Million+' },
];

const employeeOptions = [
  { value: '', label: 'Select...' },
  { value: 'Just me, no revenue', label: 'Just me, no revenue' },
  { value: 'Just me, some revenue', label: 'Just me, some revenue' },
  { value: 'Me and vendors', label: 'Me and vendors' },
  { value: '2 to 4', label: '2 to 4' },
  { value: '5 to 9', label: '5 to 9' },
  { value: '10 to 19', label: '10 to 19' },
  { value: '20 to 49', label: '20 to 49' },
  { value: '50 to 99', label: '50 to 99' },
  { value: '100 to 249', label: '100 to 249' },
  { value: '250 to 500', label: '250 to 500' },
];

interface CustomSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
  id: string;
}

const CustomSelect = ({ label, value, options, onChange, error, id }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || 'Select...';

  return (
    <div className="w-full" ref={selectRef}>
      <label 
        htmlFor={id}
        className="block text-base text-gray-700 mb-2"
      >
        {label}
        <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full px-5 py-4 text-left text-xl",
            "bg-white border-2 rounded-lg",
            "transition-colors duration-150 ease-in-out",
            "flex items-center justify-between",
            "min-h-[60px]",
            "focus:outline-none",
            isOpen ? "border-teal-500 ring-2 ring-teal-200" : "border-gray-300",
            error ? "border-red-500" : "",
            !value ? "text-gray-400" : "text-gray-900"
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? "true" : "false"}
        >
          <span className="font-normal">{selectedLabel}</span>
          <ChevronDown 
            className={cn(
              "w-6 h-6 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto"
            role="listbox"
          >
            {options.filter(opt => opt.value !== '').map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full px-5 py-3.5 text-left text-lg",
                  "hover:bg-gray-50 transition-colors",
                  value === option.value && "bg-teal-50 text-teal-700 font-medium"
                )}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export function BusinessDetailsScreen({
  employees,
  revenue,
  painPoints,
  errors = {},
  isLoading,
  onEmployeesChange,
  onRevenueChange,
  onPainPointsChange,
  onPrevious,
  onSubmit,
}: BusinessDetailsScreenProps) {
  const [localErrors, setLocalErrors] = React.useState<{
    employees?: string;
    revenue?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const employeeError = validateSelection(employees, '# of full time employees');
    const revenueError = validateSelection(revenue, 'your revenue range');

    if (employeeError || revenueError) {
      setLocalErrors({
        employees: employeeError || undefined,
        revenue: revenueError || undefined,
      });
      return;
    }

    setLocalErrors({});
    await onSubmit(employees, revenue, painPoints);
  };

  const displayErrors = {
    employees: localErrors.employees || errors.employees,
    revenue: localErrors.revenue || errors.revenue,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-normal text-center text-gray-900">
        Where are you in your <strong className="font-bold">business journey</strong>?
      </h2>

      {/* Employee Count */}
      <CustomSelect
        label="# of full time employees"
        value={employees}
        options={employeeOptions}
        onChange={onEmployeesChange}
        error={displayErrors.employees}
        id="employees"
      />

      {/* Annual Revenue */}
      <CustomSelect
        label="Annual Business Revenue"
        value={revenue}
        options={revenueOptions}
        onChange={onRevenueChange}
        error={displayErrors.revenue}
        id="revenue"
      />

      {/* Pain Points */}
      <div className="pt-4">
        <h3 className="text-xl font-normal text-center mb-4 text-gray-900">
          Where are you and your team <strong className="font-bold">stuck in the weeds</strong> the most?
        </h3>
        <FormTextarea
          placeholder="Describe your pain points (optional)..."
          value={painPoints}
          onChange={(e) => onPainPointsChange(e.target.value)}
          id="painPoints"
          rows={4}
        />
      </div>

      <div className="flex justify-center pt-4">
        <PillButton type="submit" variant="primary" loading={isLoading}>
          {isLoading ? 'GENERATING YOUR REPORT...' : 'GET MY EA ROADMAP'}
        </PillButton>
      </div>

      {/* Social Proof */}
      <div className="text-center space-y-1 pt-4">
        <p className="text-sm text-gray-600">
          ⭐ Get Your Roadmap in Less than 30 Seconds
        </p>
        <p className="text-sm text-gray-600">
          ⭐ Requested by over 250,000 Business Owners
        </p>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
