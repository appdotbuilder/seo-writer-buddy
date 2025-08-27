import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type Keyword } from '../schema';
import { desc } from 'drizzle-orm';

export const getKeywords = async (): Promise<Keyword[]> => {
  try {
    const results = await db.select()
      .from(keywordsTable)
      .orderBy(desc(keywordsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers for consistency with schema
    return results.map(keyword => ({
      ...keyword,
      difficulty: parseFloat(keyword.difficulty),
      cpc: parseFloat(keyword.cpc)
    }));
  } catch (error) {
    console.error('Failed to fetch keywords:', error);
    throw error;
  }
};