import { db } from '../db';
import { optimizationSuggestionsTable, contentOutlinesTable } from '../db/schema';
import { type CreateOptimizationSuggestionInput, type OptimizationSuggestion } from '../schema';
import { eq } from 'drizzle-orm';

export const createOptimizationSuggestion = async (input: CreateOptimizationSuggestionInput): Promise<OptimizationSuggestion> => {
  try {
    // Verify content outline exists to prevent foreign key constraint violation
    const contentOutline = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, input.content_outline_id))
      .execute();

    if (contentOutline.length === 0) {
      throw new Error(`Content outline with id ${input.content_outline_id} not found`);
    }

    // Insert optimization suggestion record
    const result = await db.insert(optimizationSuggestionsTable)
      .values({
        content_outline_id: input.content_outline_id,
        suggestion_type: input.suggestion_type,
        priority: input.priority,
        suggestion: input.suggestion,
        current_value: input.current_value,
        recommended_value: input.recommended_value,
        impact_score: input.impact_score.toString(), // Convert number to string for numeric column
        is_implemented: input.is_implemented
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const suggestion = result[0];
    return {
      ...suggestion,
      impact_score: parseFloat(suggestion.impact_score) // Convert string back to number
    };
  } catch (error) {
    console.error('Optimization suggestion creation failed:', error);
    throw error;
  }
};