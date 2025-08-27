import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type ContentOutline } from '../schema';
import { eq } from 'drizzle-orm';

export const getContentOutlineById = async (id: number): Promise<ContentOutline | null> => {
  try {
    const result = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const contentOutline = result[0];
    return {
      ...contentOutline,
      word_count_target: contentOutline.word_count_target, // Already integer
      estimated_reading_time: contentOutline.estimated_reading_time // Already integer
    };
  } catch (error) {
    console.error('Content outline retrieval failed:', error);
    throw error;
  }
};