"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface FormInputOption {
  value: string;
  label: string;
}

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "text" | "email" | "tel" | "select";
  error?: string;
  options?: FormInputOption[];
  selectValue?: string;
  onSelectChange?: (value: string) => void;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      type = "text",
      error,
      placeholder,
      options = [],
      selectValue,
      onSelectChange,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "w-full rounded-[var(--radius-md)] border border-border bg-[var(--color-surface)] px-4 py-3 text-base text-primary shadow-sm transition-all duration-[150ms] ease-in-out",
      "placeholder:text-[color:var(--color-muted)]",
      "focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color:rgba(43,122,120,0.18)]",
      "min-h-[56px]",
      error && "border-red-500 focus:border-red-500 focus:ring-red-200",
      className
    );

    const phoneStyles = type === "tel" ? "pl-[70px]" : "";

    if (type === "select") {
      return (
        <div className="w-full">
          <Select value={selectValue} onValueChange={onSelectChange}>
            <SelectTrigger
              className={cn(
                baseStyles,
                "h-auto justify-between text-left",
                !selectValue && "text-[color:var(--color-muted)]"
              )}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${props.id}-error` : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="rounded-[var(--radius-md)] border border-border bg-white p-1 shadow-[0_16px_32px_rgba(26,24,22,0.12)]">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="min-h-[44px] rounded-[8px] px-3 py-2 text-sm text-primary outline-none hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p
              id={props.id ? `${props.id}-error` : undefined}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        <Input
          ref={ref}
          type={type}
          className={cn(baseStyles, phoneStyles)}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };
