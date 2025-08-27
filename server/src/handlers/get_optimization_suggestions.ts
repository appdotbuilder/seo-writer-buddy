import { db } from '../db';
import { optimizationSuggestionsTable } from '../db/schema';
import { type OptimizationSuggestion } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOptimizationSuggestions(contentOutlineId: number): Promise<OptimizationSuggestion[]> {
  try {
    const results = await db.select()
      .from(optimizationSuggestionsTable)
      .where(eq(optimizationSuggestionsTable.content_outline_id, contentOutlineId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(suggestion => ({
      ...suggestion,
      impact_score: parseFloat(suggestion.impact_score) // Convert numeric string back to number
    }));
  } catch (error) {
    console.error('Failed to get optimization suggestions:', error);
    throw error;
  }
}