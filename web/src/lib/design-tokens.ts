/**
 * EA Time Freedom Report Design System - Design Tokens
 *
 * These tokens define the visual language for the acquisition.com/roadmap-style
 * progressive disclosure form experience.
 *
 * Color Psychology Journey:
 * - Purple (#6F00FF): Brand entry (Step 0) and exit (final steps)
 * - Yellow (#FFFC8C): Progress momentum (Steps 1-2)
 * - Back to Purple: Completion/conversion (Step 3+)
 */

/**
 * Color tokens for the design system
 */
export const colors = {
  /** Primary brand color - Purple for CTAs, header, footer, brand elements */
  primary: '#6F00FF',

  /** Progress color - Yellow for mid-journey continue buttons */
  progress: '#FFFC8C',

  /** Progress disabled color - Muted yellow for validation/disabled states */
  progressDisabled: '#F9E57F',

  /** Input background - Default light gray */
  inputBg: '#F5F8FA',

  /** Input focus background - Slightly darker gray */
  inputFocus: '#ECF0F3',

  /** Navy header color */
  navy: '#1A1A2E',
} as const;

/**
 * Border radius tokens
 */
export const borderRadius = {
  /** Large CTA pill buttons (50px) */
  pill: '50px',

  /** Form field corners (5px) */
  input: '5px',
} as const;

/**
 * Font size tokens with associated line-height and weight
 */
export const fontSize = {
  /** Question text - 32px, line-height 1.2, bold */
  question: {
    size: '32px',
    lineHeight: '1.2',
    fontWeight: '700',
  },

  /** Button text - 24px, line-height 1, bold */
  button: {
    size: '24px',
    lineHeight: '1',
    fontWeight: '700',
  },

  /** Input text - 20px, line-height 1.5 */
  input: {
    size: '20px',
    lineHeight: '1.5',
  },

  /** Previous link text - 18px, line-height 1.5 */
  previous: {
    size: '18px',
    lineHeight: '1.5',
  },

  /** Body text - 16px, line-height 1.5 */
  body: {
    size: '16px',
    lineHeight: '1.5',
  },
} as const;

/**
 * Spacing tokens for component-specific dimensions
 */
export const spacing = {
  /** Pill button height */
  buttonHeight: '84px',

  /** Desktop button width */
  buttonWidth: '408px',

  /** Form container max-width */
  formMax: '650px',
} as const;

/**
 * Animation/transition tokens
 */
export const transitions = {
  /** Button hover/active transition duration */
  button: '200ms',

  /** Input focus transition duration */
  input: '150ms',

  /** Form step change transition duration */
  step: '300ms',
} as const;

/**
 * Easing functions for animations
 */
export const easing = {
  /** Button animation easing */
  button: 'ease-out',

  /** Input animation easing */
  input: 'ease-in-out',
} as const;

/**
 * CSS Custom Property names for design tokens
 * Use these to reference tokens in runtime CSS or inline styles
 */
export const cssVars = {
  // Colors
  primary: '--primary',
  progress: '--progress',
  progressDisabled: '--progress-disabled',
  inputBg: '--input-bg',
  inputFocus: '--input-focus',
  navy: '--navy',

  // Border radius
  radiusPill: '--radius-pill',
  radiusInput: '--radius-input',

  // Font sizes
  textQuestion: '--text-question',
  textButton: '--text-button',
  textInput: '--text-input',
  textPrevious: '--text-previous',
  textBody: '--text-body',

  // Spacing
  buttonHeight: '--spacing-button-height',
  buttonWidth: '--spacing-button-width',
  formMax: '--spacing-form-max',

  // Transitions
  transitionButton: '--transition-button',
  transitionInput: '--transition-input',
  transitionStep: '--transition-step',

  // Easing
  easeButton: '--ease-button',
  easeInput: '--ease-input',
} as const;

/**
 * Tailwind CSS utility class names for design tokens
 */
export const utilityClasses = {
  // Background colors
  bgPrimary: 'bg-primary',
  bgProgress: 'bg-progress',
  bgProgressDisabled: 'bg-progress-disabled',
  bgInputBg: 'bg-input-bg',
  bgInputFocus: 'bg-input-focus',
  bgNavy: 'bg-navy',

  // Text colors
  textPrimary: 'text-primary',
  textProgress: 'text-progress',
  textNavy: 'text-navy',

  // Border radius
  roundedPill: 'rounded-pill',
  roundedInput: 'rounded-input',

  // Font sizes
  textQuestion: 'text-question',
  textButtonSize: 'text-button-size',
  textInputSize: 'text-input-size',
  textPrevious: 'text-previous',
  textBodySize: 'text-body-size',

  // Spacing
  hButton: 'h-button',
  wButton: 'w-button',
  maxWForm: 'max-w-form',

  // Transitions
  transitionButton: 'transition-button',
  transitionInput: 'transition-input',
  transitionStep: 'transition-step',
} as const;

// Type exports for consumers
export type DesignColors = typeof colors;
export type DesignBorderRadius = typeof borderRadius;
export type DesignFontSize = typeof fontSize;
export type DesignSpacing = typeof spacing;
export type DesignTransitions = typeof transitions;
export type DesignEasing = typeof easing;
