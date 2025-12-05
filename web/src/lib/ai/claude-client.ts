import Anthropic from '@anthropic-ai/sdk';
import type { TaskGenerationResult } from '@/types';

/**
 * Generate tasks using Claude Haiku 4.5
 * 
 * Uses the Anthropic API to generate structured task reports.
 * Haiku 4.5 is optimized for speed while maintaining quality.
 * 
 * @param prompt - The complete prompt string
 * @returns TaskGenerationResult
 */
export async function generateWithClaude(prompt: string): Promise<TaskGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  console.log('[Claude] Generating tasks with Claude Haiku 4.5...');
  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const duration = Date.now() - startTime;
    console.log(`[Claude] Generation completed in ${duration}ms`);

    // Extract text content
    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonStr = contentBlock.text;

    // Clean up markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/g, '');
    }
    
    jsonStr = jsonStr.trim();

    try {
      const result = JSON.parse(jsonStr) as TaskGenerationResult;
      return result;
    } catch (parseError) {
      console.error('[Claude] JSON Parse Error:', parseError);
      console.error('[Claude] Raw Output:', jsonStr);
      throw new Error('Failed to parse Claude response as JSON');
    }
  } catch (error) {
    console.error('[Claude] API Error:', error);
    throw error;
  }
}

