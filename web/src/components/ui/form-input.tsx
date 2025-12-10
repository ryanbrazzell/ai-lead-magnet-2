"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/**
 * Option type for select variant
 */
export interface FormInputOption {
  value: string;
  label: string;
}

/**
 * FormInput component props
 */
export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Input type: text, email, tel, or select */
  type?: "text" | "email" | "tel" | "select";
  /** Error message to display below the input */
  error?: string;
  /** Options for select variant */
  options?: FormInputOption[];
  /** Value for select variant (controlled) */
  selectValue?: string;
  /** onChange handler for select variant */
  onSelectChange?: (value: string) => void;
}

/**
 * FormInput Component
 *
 * A styled form input component that extends shadcn/ui Input with design system tokens.
 * Supports text, email, tel, and select variants with consistent styling.
 *
 * Design System Styling:
 * - Background: #F5F8FA (bg-input-bg)
 * - Focus: #ECF0F3 (bg-input-focus) with 150ms transition
 * - Border radius: 5px (rounded-input)
 * - Font size: 20px (text-input-size)
 * - Padding: 13px
 * - Placeholder: uppercase, muted gray
 * - Phone variant: 70px left padding for country flag/prefix
 * - Error state: red border with error message below
 *
 * Touch Target (Task Group 8):
 * - Minimum height: 44px for accessibility
 * - All interactive elements meet WCAG 2.1 touch target requirements
 */
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
    // Base styles matching Acquisition.com design
    const baseStyles = cn(
      // White background with subtle gray border (matching Acquisition.com)
      "bg-white",
      "transition-all duration-[150ms] ease-in-out",
      // Rounded corners
      "rounded-lg",
      // Larger font size for input text (matching Acquisition.com)
      "text-xl",
      // Generous padding
      "px-5 py-4",
      // Minimum touch target height
      "min-h-[56px]",
      // Placeholder styling - NOT uppercase, gray color
      "placeholder:text-gray-400 placeholder:font-normal",
      // Visible border (matching Acquisition.com)
      "border-2 border-gray-200",
      // Focus state with gold accent (matching brand scheme)
      "focus:outline-none focus:ring-0 focus:border-[#f59e0b]",
      // Full width
      "w-full",
      // Error state
      error && "border-red-500",
      className
    );

    // Phone variant has extra left padding for country flag/prefix
    const phoneStyles = type === "tel" ? "pl-[70px]" : "";

    // Render select variant
    if (type === "select") {
      return (
        <div className="w-full">
          <Select value={selectValue} onValueChange={onSelectChange}>
            <SelectTrigger
              className={cn(
                baseStyles,
                // Override default trigger styles
                "h-auto",
                // Minimum touch target height (Task Group 8: 44px minimum)
                "min-h-[44px]",
                // Ensure chevron is visible
                "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:opacity-100",
                error && "border-red-500"
              )}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${props.id}-error` : undefined}
            >
              <SelectValue
                placeholder={placeholder}
                className="placeholder:text-gray-400"
              />
            </SelectTrigger>
            <SelectContent
              className={cn(
                "bg-white border border-gray-200 shadow-lg",
                "rounded-input"
              )}
            >
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-input-size py-2 px-3 cursor-pointer hover:bg-input-focus min-h-[44px]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p
              id={props.id ? `${props.id}-error` : undefined}
              className="text-red-500 text-sm mt-1"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      );
    }

    // Render text, email, or tel input
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
            className="text-red-500 text-sm mt-1"
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
