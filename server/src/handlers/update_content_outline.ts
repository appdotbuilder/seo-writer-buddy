import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type UpdateContentOutlineInput, type ContentOutline } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateContentOutline(input: UpdateContentOutlineInput): Promise<ContentOutline> {
  try {
    // First verify the content outline exists
    const existingOutline = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, input.id))
      .execute();

    if (existingOutline.length === 0) {
      throw new Error(`Content outline with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData['title'] = input.title;
    }

    if (input.target_keyword !== undefined) {
      updateData['target_keyword'] = input.target_keyword;
    }

    if (input.secondary_keywords !== undefined) {
      updateData['secondary_keywords'] = input.secondary_keywords;
    }

    if (input.meta_description !== undefined) {
      updateData['meta_description'] = input.meta_description;
    }

    if (input.word_count_target !== undefined) {
      updateData['word_count_target'] = input.word_count_target;
    }

    if (input.outline_structure !== undefined) {
      updateData['outline_structure'] = input.outline_structure;
    }

    if (input.seo_suggestions !== undefined) {
      updateData['seo_suggestions'] = input.seo_suggestions;
    }

    if (input.content_type !== undefined) {
      updateData['content_type'] = input.content_type;
    }

    if (input.difficulty_level !== undefined) {
      updateData['difficulty_level'] = input.difficulty_level;
    }

    if (input.estimated_reading_time !== undefined) {
      updateData['estimated_reading_time'] = input.estimated_reading_time;
    }

    // Perform the update
    const result = await db.update(contentOutlinesTable)
      .set(updateData)
      .where(eq(contentOutlinesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const updatedOutline = result[0];
    return {
      ...updatedOutline,
      // No numeric columns in content_outlines table that need conversion
    };
  } catch (error) {
    console.error('Content outline update failed:', error);
    throw error;
  }
}