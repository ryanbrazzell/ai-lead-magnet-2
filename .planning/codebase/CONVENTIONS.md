# Coding Conventions

**Analysis Date:** 2026-02-23

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `FormInput.tsx`, `MultiStepForm.tsx`)
- Utilities/helpers: camelCase with `.ts` extension (e.g., `validation.ts`, `design-tokens.ts`)
- Test files: same name as source with `.test.ts` or `.test.tsx` suffix (e.g., `form-input.test.tsx`)
- Hooks: camelCase starting with `use` (e.g., `use-button-variant.ts`, `use-meta-tracking.ts`)
- API routes: lowercase with hyphens, organized in subdirectories (e.g., `app/api/send-email/route.ts`)

**Functions:**
- Exported functions: camelCase (e.g., `validatePhoneNumber`, `generateTasks`)
- React components: PascalCase (e.g., `FormInput`, `PillButton`, `MultiStepForm`)
- Hook functions: camelCase with `use` prefix (e.g., `useButtonVariant`)
- Internal utilities: camelCase (e.g., `createMockLeadData`, `buildUnifiedPromptJSON`)

**Variables:**
- Constants: camelCase (e.g., `baseStyles`, `errorMessages`, `clickHandledRef`)
- React state: camelCase for both value and setter (e.g., `const [currentStep, setCurrentStep]`)
- Configuration objects: camelCase (e.g., `pillButtonVariants`, `mockFetchImplementation`)

**Types:**
- Interfaces: PascalCase with prefix `I` optional (e.g., `FormInputProps`, `ValidationResult`, `UseButtonVariantProps`)
- Type aliases: PascalCase (e.g., `ButtonVariant`, `EmailSendResult`)
- Enum-like unions: uppercase constants in objects (e.g., `'primary' | 'progress' | 'disabled'`)

## Code Style

**Formatting:**
- Language: TypeScript (version 5+)
- Framework: React 19 with Next.js 16
- No explicit formatter config file (eslint.config.mjs is the primary tool)
- Indentation: 2 spaces (inferred from codebase)
- Line length: No strict limit observed, ~80-100 character average

**Linting:**
- Tool: ESLint (version 9) with Next.js configuration
- Config: `eslint.config.mjs` (ESLint flat config format)
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rules overrides observed beyond Next.js defaults
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Import Organization

**Order:**
1. React/Next.js imports (e.g., `import React from 'react'`, `"use client"`)
2. Third-party library imports (e.g., `import { ChevronDown } from 'lucide-react'`)
3. Local utility/lib imports (e.g., `import { cn } from '@/lib/utils'`)
4. Component/type imports (e.g., `import { FormInput } from './form-input'`)
5. Type-only imports (marked with `import type`)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used consistently throughout codebase for cleaner imports
- Example: `import { useButtonVariant } from '@/hooks/use-button-variant'`

**Grouping:**
- Import statements grouped by category with blank lines between groups
- Specific imports listed before wildcard imports
- Type imports separated from value imports

## Error Handling

**Patterns:**
- Validation returns structured `ValidationResult` objects with `isValid` boolean and optional `error` string
  - Example: `{ isValid: false, error: 'Please enter a valid phone number' }`
- API errors use detailed error response objects (e.g., `EmailErrorResponse`, `MailgunErrorDetails`)
- Try-catch blocks wrap async operations with detailed error logging
- Error states managed in component state with user-facing error messages
- Form validation errors prevent progression and display inline near fields with aria-invalid attributes

**Error Types:**
- Validation errors: `ValidationResult` interface with message keys matching field names
- API errors: Structured response objects containing error details and HTTP status codes
- Runtime errors: Caught in try-catch with logging to console.error (async operations don't throw)

**User Feedback:**
- Form errors displayed below fields with CSS class `text-red-500 text-sm mt-1`
- Error messages are user-friendly and specific to the field or action
- Loading states show spinners (Loader2 icon) to indicate pending operations

## Logging

**Framework:** `console` object (no logging library detected)

**Patterns:**
- `console.error()` used in catch blocks for error logging
- Logged in async handlers but errors don't throw to prevent page crashes
- Example: Email send operations log errors asynchronously without throwing
- No structured logging or monitoring library integrated

**When to Log:**
- API errors and failures
- Async operations that could fail silently
- Development troubleshooting (test setup, mock verification)

## Comments

**When to Comment:**
- At file level: JSDoc blocks with purpose and task group references
- Before major code sections: Comment explaining intent (not obvious from code)
- Complex logic: Explain why, not what (code shows what)
- Design decisions: Reference related specs or task groups when applicable

**JSDoc/TSDoc:**
- Used extensively for function definitions and component props
- Format: `/** ... */` multi-line blocks with `@param`, `@returns`, `@example` tags
- Component documentation includes design system tokens, accessibility notes, and usage examples
- Hook documentation includes property explanations and decision rationale

**Example:**
```typescript
/**
 * Validates phone number
 * - Strips non-digit characters using regex
 * - Checks minimum 10 digits
 *
 * @param phone - Phone number string in any format
 * @returns ValidationResult with isValid boolean and optional error message
 */
export function validatePhoneNumber(phone: string): ValidationResult {
```

## Function Design

**Size:**
- Most utility functions: 10-30 lines
- Component functions: 20-100 lines with forwardRef patterns
- Hooks: 20-40 lines with useMemo optimization

**Parameters:**
- Typed explicitly (no implicit any)
- Props interfaces defined for components (e.g., `FormInputProps`)
- Required fields listed before optional fields
- Destructuring used in function signatures for components and hooks

**Return Values:**
- Explicit return types in function signatures
- React components return JSX.Element implicitly
- Utility functions return typed objects (ValidationResult, EmailSendResult, etc.)
- Hooks return objects or tuples with clear naming (e.g., `UseButtonVariantReturn`)

## Module Design

**Exports:**
- Named exports preferred for utilities and functions (e.g., `export function validatePhoneNumber`)
- Default exports for React components when single component per file
- Type exports use `export type` keyword
- Barrel files aggregate related exports (e.g., `src/types/index.ts`)

**Barrel Files:**
- `src/types/index.ts` exports all type definitions
- `src/hooks/index.ts` exports all custom hooks
- Enables clean imports like `import { useButtonVariant } from '@/hooks'`
- Located at directory level for logical grouping

**File Organization:**
- One component per file (with `displayName` set for debugging)
- Interfaces/types defined above component or in separate .ts file
- Props interfaces named `ComponentNameProps` (e.g., `FormInputProps`)
- Variants/styles defined as constants before component export

---

*Convention analysis: 2026-02-23*
