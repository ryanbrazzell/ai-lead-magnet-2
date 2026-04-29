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
            "min-h-[140px] w-full resize-y rounded-[var(--radius-md)] border border-border bg-[var(--color-surface)] p-4 text-base text-primary shadow-sm transition-all duration-[150ms] ease-in-out",
            "placeholder:text-[color:var(--color-muted)]",
            "focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color:rgba(43,122,120,0.18)]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-200",
            className
          )}
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

FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
