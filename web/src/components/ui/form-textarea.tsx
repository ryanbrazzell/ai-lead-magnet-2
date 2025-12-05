/**
 * FormTextarea Component
 *
 * A styled textarea component that matches the design system styling
 * of FormInput components. Used for multi-line text input like pain points.
 *
 * Design System Styling:
 * - Background: #F5F8FA (bg-input-bg)
 * - Focus: #ECF0F3 (bg-input-focus) with 150ms transition
 * - Border radius: 5px (rounded-input)
 * - Font size: 20px (text-input-size)
 * - Padding: 13px
 * - Placeholder: uppercase, muted gray
 * - Error state: red border with error message below
 * - Minimum height: 120px for comfortable multi-line input
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error message to display below the textarea */
  error?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, error, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            // Background with focus transition
            "bg-input-bg focus:bg-input-focus",
            "transition-colors duration-[150ms] ease-in-out",
            // Border radius from design tokens
            "rounded-input",
            // Font size from design tokens
            "text-input-size",
            // Padding
            "p-[13px]",
            // Minimum height for comfortable multi-line input
            "min-h-[120px]",
            // Placeholder styling
            "placeholder:uppercase placeholder:text-gray-400",
            // Border (default transparent, error shows red)
            "border-2 border-transparent",
            // Focus outline removal (using background change instead)
            "focus:outline-none focus:ring-0",
            // Full width
            "w-full",
            // Resize behavior
            "resize-y",
            // Error state
            error && "border-red-500",
            className
          )}
          placeholder={placeholder?.toUpperCase()}
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

FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
