# Testing Patterns

**Analysis Date:** 2026-02-23

## Test Framework

**Runner:**
- Framework: Vitest (version 4.0.14)
- Config: `vitest.config.ts` with jsdom environment
- Globals enabled for describe/it/expect without imports

**Assertion Library:**
- Framework: Vitest built-in expect (compatible with Jest)
- DOM matchers: `@testing-library/jest-dom` (version 6.9.1)
- React testing: `@testing-library/react` (version 16.3.0)

**Run Commands:**
```bash
npm test                                    # Run tests in watch mode
npm run test:run                           # Run all tests once
npm run test:design-tokens                 # Run specific test: design-tokens.test.ts
npm run test:form-input                    # Run specific test: form-input.test.tsx
npm run test:post-submission               # Run specific test: post-submission.test.tsx
npm run test:color-psychology              # Run specific test: use-button-variant.test.ts
npm run test:responsive                    # Run specific test: responsive-behavior.test.tsx
```

## Test File Organization

**Location:**
- Co-located with source: Tests next to components in same directory (e.g., `form-input.tsx` + `form-input.test.tsx`)
- Grouped in `__tests__` subdirectory for larger modules (e.g., `src/lib/ai/__tests__/task-generator.test.ts`)
- E2E tests in dedicated `tests/e2e/` directory

**Naming:**
- Test files: `[name].test.ts` or `[name].test.tsx` suffix
- Directories: `__tests__` folder for test grouping
- Example: `src/components/ui/form-input.test.tsx`, `src/lib/ai/__tests__/task-generator.test.ts`

**Structure:**
```
src/
├── components/
│   ├── ui/
│   │   ├── form-input.tsx
│   │   └── form-input.test.tsx (co-located)
│   ├── form/
│   │   ├── multi-step-form.tsx
│   │   └── __tests__/
│   │       ├── multi-step-form.test.tsx
│   │       └── form-step1.test.tsx
│   └── layout/
│       ├── header.tsx
│       └── __tests__/
│           └── header.test.tsx
├── lib/
│   ├── validation.ts
│   ├── __tests__/
│   │   └── validation.test.ts
│   └── ai/
│       ├── task-generator.ts
│       └── __tests__/
│           └── task-generator.test.ts
└── __tests__/ (integration tests)
    └── form-step1-integration.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Component/Module Name', () => {
  // Optional setup
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Optional cleanup
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature/Behavior Category', () => {
    it('should do specific thing when condition met', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Patterns:**
- `describe()` blocks group related tests by feature or behavior
- `it()` blocks test individual behaviors with clear descriptions
- Setup: `beforeEach()` for common test initialization (vi.resetAllMocks, environment setup)
- Teardown: `afterEach()` for cleanup (vi.clearAllMocks)
- Nested `describe()` blocks for organizing test scenarios

**Assertion Pattern:**
```typescript
// Arrange - set up test conditions
const mockData = createMockLeadData('main');

// Act - execute the code being tested
const result = await generateTasks(mockData);

// Assert - verify the results
expect(result.total_task_count).toBe(30);
expect(result.tasks.daily).toHaveLength(10);
```

## Mocking

**Framework:** Vitest `vi` object

**Patterns:**
```typescript
// Mock entire module
vi.mock('../gemini-client', () => ({
  generateWithGemini: vi.fn(),
}));

// Mock function
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});
global.fetch = mockFetch;

// Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
});

// Verify mock was called
expect(generateWithGemini).toHaveBeenCalledWith(prompt);
expect(mockFetch).toHaveBeenCalledTimes(1);

// Setup mock return values
vi.mocked(buildUnifiedPromptJSON).mockReturnValue('unified-prompt');
vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);
```

**What to Mock:**
- External API clients (Gemini, Mailgun, S3)
- Global objects (fetch, environment variables via vi.stubEnv)
- Complex dependencies that slow down tests
- Database or file system operations
- Third-party services

**What NOT to Mock:**
- Core validation logic (test real implementations)
- Type definitions and interfaces
- Utility functions like `cn()` (use real implementations)
- DOM/React Testing Library utilities (they handle mocking internally)
- Test data factory functions

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function pattern
function createMockLeadData(leadType: 'main' | 'simple' | 'standard'): UnifiedLeadData {
  return {
    firstName: 'John',
    lastName: 'Doe',
    leadType: leadType,
    // ... required fields
  };
}

function createMockTaskResult(): TaskGenerationResult {
  return {
    total_task_count: 30,
    tasks: {
      daily: Array(10).fill(null).map((_, i) => ({
        title: `Daily Task ${i + 1}`,
        description: 'Test task',
        owner: 'EA',
        isEA: true,
        category: 'operations',
      })),
      // ... other task arrays
    },
  };
}

// Usage in tests
const mockData = createMockLeadData('main');
const result = await generateTasks(mockData);
```

**Location:**
- Factories defined within test files (co-located)
- No shared fixtures file observed; each test file defines its own factories
- Example: `form-step1-integration.test.tsx` defines `createMockLeadData()` for its tests

**Benefits:**
- Factories ensure consistent test data
- Named parameters make test intent clear
- Easy to extend for edge case testing

## Coverage

**Requirements:** Not enforced (no coverage thresholds detected)

**View Coverage:**
```bash
# Coverage not explicitly configured in vitest.config.ts
# Can be added with: npm run test:run -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, and components
- Approach: Test single responsibility (validation, computation, rendering)
- Files: `src/lib/__tests__/validation.test.ts`, `src/components/ui/form-input.test.tsx`
- Example: Testing `validatePhoneNumber()` function with various phone formats

**Integration Tests:**
- Scope: Multiple components/modules working together
- Approach: Test data flow across form screens or through workflows
- Files: `src/__tests__/form-step1-integration.test.tsx`, `src/app/__tests__/multi-step-form-e2e.test.tsx`
- Example: Form navigation from Screen 1 through Screen 6 with data persistence

**E2E Tests:**
- Framework: Playwright (version 1.57.0)
- Files: `tests/e2e/capture-screenshots.spec.ts`, `tests/e2e/roi-test.spec.ts`
- Approach: Full user workflows in real browser
- Used for critical user journeys and cross-browser testing

## Common Patterns

**Async Testing:**
```typescript
// Pattern 1: async/await with waitFor
it('navigates to next screen after API success', async () => {
  render(<MultiStepForm />);

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/next screen/i)).toBeInTheDocument();
  });
});

// Pattern 2: Mock fetch with async handlers
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, leadId: 'lead_123' }),
  });
});

// Pattern 3: Mocked promise rejections
vi.mocked(generateWithGemini).mockRejectedValue(
  new Error('Gemini API error: rate limit exceeded')
);

await expect(generateTasks(mockLeadData)).rejects.toThrow(/Gemini API/);
```

**Error Testing:**
```typescript
// Pattern 1: Testing error state display
it('error state shows red border and error message', () => {
  const errorMessage = 'Please complete this required field.';

  render(<FormInput error={errorMessage} id="test-input" />);

  const errorText = screen.getByRole('alert');
  expect(errorText).toHaveTextContent(errorMessage);
  expect(errorText).toHaveClass('text-red-500');
});

// Pattern 2: Testing error boundaries in async
it('handles API failure gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));

  render(<MultiStepForm />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});

// Pattern 3: Testing validation error returns
it('rejects invalid input', () => {
  const result = validatePhoneNumber('123'); // Too short

  expect(result.isValid).toBe(false);
  expect(result.error).toBe('Please enter a valid phone number (at least 10 digits)');
});
```

**React Component Testing:**
```typescript
// Pattern 1: Render and query
it('renders with correct attributes', () => {
  render(<FormInput type="text" placeholder="Test" />);

  const input = screen.getByRole('textbox');
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveAttribute('placeholder', 'TEST'); // Uppercase
});

// Pattern 2: User interaction
it('fires onChange when user types', () => {
  const handleChange = vi.fn();
  render(<FormInput onChange={handleChange} />);

  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'test' } });

  expect(handleChange).toHaveBeenCalled();
});

// Pattern 3: Focus/blur events
it('applies focus styles on focus', () => {
  render(<FormInput />);
  const input = screen.getByRole('textbox');

  fireEvent.focus(input);
  expect(input).toHaveClass('focus:bg-input-focus');
});

// Pattern 4: Conditional rendering (select variant)
it('renders select variant with options', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
  ];

  render(
    <FormInput type="select" options={options} placeholder="Choose" />
  );

  const selectTrigger = screen.getByRole('combobox');
  expect(selectTrigger).toBeInTheDocument();
});
```

**Testing With Testing Library:**
```typescript
// Preferred queries (by priority)
screen.getByRole('button', { name: /submit/i })    // Most accessible
screen.getByPlaceholderText(/email/i)               // For inputs
screen.getByText(/welcome/i)                        // For text
screen.getByTestId('form-input')                    // Last resort
screen.queryByText(/missing/)                       // Check absence
screen.getAllByRole('option')                       // Multiple elements

// Interactions
fireEvent.click(element)
fireEvent.change(input, { target: { value: 'text' } })
fireEvent.focus(input)

// Async waiting
await waitFor(() => expect(...).toBeInTheDocument())
await screen.findByText(/async content/)
```

**Setup File Configuration:**
- Location: `src/test/setup.ts`
- Content: Minimal - imports `@testing-library/jest-dom` for extended matchers
- Used by vitest config: `setupFiles: ['./src/test/setup.ts']`

---

*Testing analysis: 2026-02-23*
