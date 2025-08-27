import { db } from '../db';
import { optimizationSuggestionsTable } from '../db/schema';
import { type OptimizationSuggestion } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSuggestionStatus(suggestionId: number, isImplemented: boolean): Promise<OptimizationSuggestion | null> {
  try {
    // Update the suggestion's implementation status
    const result = await db.update(optimizationSuggestionsTable)
      .set({
        is_implemented: isImplemented
      })
      .where(eq(optimizationSuggestionsTable.id, suggestionId))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Suggestion not found
    }

    // Convert numeric fields back to numbers before returning
    const suggestion = result[0];
    return {
      ...suggestion,
      impact_score: parseFloat(suggestion.impact_score)
    };
  } catch (error) {
    console.error('Update suggestion status failed:', error);
    throw error;
  }
}