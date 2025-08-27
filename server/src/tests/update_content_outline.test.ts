import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type UpdateContentOutlineInput, type CreateContentOutlineInput } from '../schema';
import { updateContentOutline } from '../handlers/update_content_outline';
import { eq } from 'drizzle-orm';

// Helper function to create a test content outline
async function createTestContentOutline(): Promise<number> {
  const testInput: CreateContentOutlineInput = {
    title: 'Original SEO Guide',
    target_keyword: 'seo basics',
    secondary_keywords: '["keyword research", "on-page seo"]',
    meta_description: 'Original meta description for SEO guide',
    word_count_target: 2000,
    outline_structure: '{"headings": ["Introduction", "What is SEO", "Conclusion"]}',
    seo_suggestions: '["Use H1 tags", "Add internal links"]',
    content_type: 'guide',
    difficulty_level: 'beginner',
    estimated_reading_time: 8
  };

  const result = await db.insert(contentOutlinesTable)
    .values({
      ...testInput,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0].id;
}

describe('updateContentOutline', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a content outline with all fields', async () => {
    const outlineId = await createTestContentOutline();

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId,
      title: 'Advanced SEO Strategies',
      target_keyword: 'advanced seo',
      secondary_keywords: '["technical seo", "link building", "content optimization"]',
      meta_description: 'Updated meta description for advanced SEO strategies',
      word_count_target: 3500,
      outline_structure: '{"headings": ["Introduction", "Technical SEO", "Link Building", "Content Strategy", "Conclusion"]}',
      seo_suggestions: '["Optimize page speed", "Use schema markup", "Build quality backlinks"]',
      content_type: 'article',
      difficulty_level: 'advanced',
      estimated_reading_time: 15
    };

    const result = await updateContentOutline(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(outlineId);
    expect(result.title).toEqual('Advanced SEO Strategies');
    expect(result.target_keyword).toEqual('advanced seo');
    expect(result.secondary_keywords).toEqual('["technical seo", "link building", "content optimization"]');
    expect(result.meta_description).toEqual('Updated meta description for advanced SEO strategies');
    expect(result.word_count_target).toEqual(3500);
    expect(result.outline_structure).toEqual('{"headings": ["Introduction", "Technical SEO", "Link Building", "Content Strategy", "Conclusion"]}');
    expect(result.seo_suggestions).toEqual('["Optimize page speed", "Use schema markup", "Build quality backlinks"]');
    expect(result.content_type).toEqual('article');
    expect(result.difficulty_level).toEqual('advanced');
    expect(result.estimated_reading_time).toEqual(15);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const outlineId = await createTestContentOutline();

    // Get original outline for comparison
    const original = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, outlineId))
      .execute();

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId,
      title: 'Updated Title Only',
      word_count_target: 2500
    };

    const result = await updateContentOutline(updateInput);

    // Verify updated fields
    expect(result.title).toEqual('Updated Title Only');
    expect(result.word_count_target).toEqual(2500);

    // Verify unchanged fields remain the same
    expect(result.target_keyword).toEqual(original[0].target_keyword);
    expect(result.secondary_keywords).toEqual(original[0].secondary_keywords);
    expect(result.meta_description).toEqual(original[0].meta_description);
    expect(result.outline_structure).toEqual(original[0].outline_structure);
    expect(result.content_type).toEqual(original[0].content_type);
    expect(result.difficulty_level).toEqual(original[0].difficulty_level);
  });

  it('should update nullable fields to null', async () => {
    const outlineId = await createTestContentOutline();

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId,
      secondary_keywords: null,
      meta_description: null,
      seo_suggestions: null
    };

    const result = await updateContentOutline(updateInput);

    expect(result.secondary_keywords).toBeNull();
    expect(result.meta_description).toBeNull();
    expect(result.seo_suggestions).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    const outlineId = await createTestContentOutline();

    // Get original timestamp
    const original = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, outlineId))
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId,
      title: 'Updated for timestamp test'
    };

    const result = await updateContentOutline(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(original[0].updated_at.getTime());
    // Verify created_at remains unchanged
    expect(result.created_at.getTime()).toEqual(original[0].created_at.getTime());
  });

  it('should save changes to database', async () => {
    const outlineId = await createTestContentOutline();

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId,
      title: 'Database Persistence Test',
      content_type: 'tutorial',
      difficulty_level: 'intermediate'
    };

    await updateContentOutline(updateInput);

    // Query database directly to verify changes were persisted
    const saved = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, outlineId))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].title).toEqual('Database Persistence Test');
    expect(saved[0].content_type).toEqual('tutorial');
    expect(saved[0].difficulty_level).toEqual('intermediate');
  });

  it('should throw error for non-existent content outline', async () => {
    const updateInput: UpdateContentOutlineInput = {
      id: 999999,
      title: 'This should fail'
    };

    await expect(updateContentOutline(updateInput))
      .rejects.toThrow(/Content outline with id 999999 not found/i);
  });

  it('should handle update with no optional fields changed', async () => {
    const outlineId = await createTestContentOutline();

    const updateInput: UpdateContentOutlineInput = {
      id: outlineId
    };

    const result = await updateContentOutline(updateInput);

    // Should succeed and only update the updated_at timestamp
    expect(result.id).toEqual(outlineId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Get original to compare
    const original = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, outlineId))
      .execute();

    expect(result.title).toEqual(original[0].title);
    expect(result.target_keyword).toEqual(original[0].target_keyword);
  });
});