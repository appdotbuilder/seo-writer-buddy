import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type ContentOutline } from '../schema';
import { desc } from 'drizzle-orm';

export const getContentOutlines = async (): Promise<ContentOutline[]> => {
  try {
    // Fetch all content outlines ordered by created_at descending (newest first)
    const results = await db.select()
      .from(contentOutlinesTable)
      .orderBy(desc(contentOutlinesTable.created_at))
      .execute();

    // No numeric fields to convert in content outlines table
    // All numeric columns (word_count_target, estimated_reading_time) are integers
    return results;
  } catch (error) {
    console.error('Failed to fetch content outlines:', error);
    throw error;
  }
};