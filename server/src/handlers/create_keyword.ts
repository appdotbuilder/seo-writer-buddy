import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type CreateKeywordInput, type Keyword } from '../schema';

export async function createKeyword(input: CreateKeywordInput): Promise<Keyword> {
  try {
    // Insert keyword record
    const result = await db.insert(keywordsTable)
      .values({
        keyword: input.keyword,
        search_volume: input.search_volume,
        difficulty: input.difficulty.toString(), // Convert number to string for numeric column
        cpc: input.cpc.toString(), // Convert number to string for numeric column
        competition: input.competition,
        trend_data: input.trend_data
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const keyword = result[0];
    return {
      ...keyword,
      difficulty: parseFloat(keyword.difficulty), // Convert string back to number
      cpc: parseFloat(keyword.cpc) // Convert string back to number
    };
  } catch (error) {
    console.error('Keyword creation failed:', error);
    throw error;
  }
}