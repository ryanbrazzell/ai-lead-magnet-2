/**
 * AI Prompts Module - Barrel Export
 *
 * This module provides all prompt-related functionality for
 * the AI task generation service.
 */

// Main prompt template
export { TIME_FREEDOM_PROMPT_JSON } from './time-freedom-prompt';

// Lead data serialization
export { serializeLeadData, buildUnifiedPromptJSON } from './serialize-lead';

// Fallback prompts
export {
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
  buildStreamlinedPrompt,
} from './fallback-prompts';
