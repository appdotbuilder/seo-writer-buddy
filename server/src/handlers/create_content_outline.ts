import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type CreateContentOutlineInput, type ContentOutline } from '../schema';

export const createContentOutline = async (input: CreateContentOutlineInput): Promise<ContentOutline> => {
  try {
    // Insert content outline record
    const result = await db.insert(contentOutlinesTable)
      .values({
        title: input.title,
        target_keyword: input.target_keyword,
        secondary_keywords: input.secondary_keywords,
        meta_description: input.meta_description,
        word_count_target: input.word_count_target,
        outline_structure: input.outline_structure,
        seo_suggestions: input.seo_suggestions,
        content_type: input.content_type,
        difficulty_level: input.difficulty_level,
        estimated_reading_time: input.estimated_reading_time
      })
      .returning()
      .execute();

    // Return the created content outline
    const contentOutline = result[0];
    return contentOutline;
  } catch (error) {
    console.error('Content outline creation failed:', error);
    throw error;
  }
};