import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type CreateContentOutlineInput } from '../schema';
import { getContentOutlines } from '../handlers/get_content_outlines';
import { desc } from 'drizzle-orm';

// Test input for creating content outlines
const testOutlineInput: CreateContentOutlineInput = {
  title: 'Ultimate Guide to SEO',
  target_keyword: 'seo guide',
  secondary_keywords: JSON.stringify(['seo tips', 'search optimization', 'ranking factors']),
  meta_description: 'Complete guide to mastering SEO for beginners and professionals',
  word_count_target: 2500,
  outline_structure: JSON.stringify({
    'Introduction': ['What is SEO?', 'Why SEO matters'],
    'Basics': ['Keywords', 'On-page optimization'],
    'Advanced': ['Technical SEO', 'Link building']
  }),
  seo_suggestions: JSON.stringify(['Use target keyword in title', 'Add internal links', 'Optimize images']),
  content_type: 'guide',
  difficulty_level: 'intermediate',
  estimated_reading_time: 12
};

const secondOutlineInput: CreateContentOutlineInput = {
  title: 'Beginner\'s Blog Post Ideas',
  target_keyword: 'blog post ideas',
  secondary_keywords: JSON.stringify(['content ideas', 'blogging tips']),
  meta_description: 'Fresh blog post ideas for new content creators',
  word_count_target: 1500,
  outline_structure: JSON.stringify({
    'Introduction': ['Why ideas matter'],
    'Main Content': ['50 blog post ideas', 'How to expand ideas']
  }),
  seo_suggestions: JSON.stringify(['Focus on long-tail keywords']),
  content_type: 'blog_post',
  difficulty_level: 'beginner',
  estimated_reading_time: 8
};

describe('getContentOutlines', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no outlines exist', async () => {
    const result = await getContentOutlines();

    expect(result).toEqual([]);
  });

  it('should fetch single content outline', async () => {
    // Create test outline
    await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput
      })
      .execute();

    const result = await getContentOutlines();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Ultimate Guide to SEO');
    expect(result[0].target_keyword).toEqual('seo guide');
    expect(result[0].word_count_target).toEqual(2500);
    expect(result[0].content_type).toEqual('guide');
    expect(result[0].difficulty_level).toEqual('intermediate');
    expect(result[0].estimated_reading_time).toEqual(12);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch all content outlines', async () => {
    // Create multiple test outlines
    await db.insert(contentOutlinesTable)
      .values([
        { ...testOutlineInput },
        { ...secondOutlineInput }
      ])
      .execute();

    const result = await getContentOutlines();

    expect(result).toHaveLength(2);
    
    // Verify both outlines are returned
    const titles = result.map(outline => outline.title);
    expect(titles).toContain('Ultimate Guide to SEO');
    expect(titles).toContain('Beginner\'s Blog Post Ideas');
  });

  it('should return outlines ordered by created_at descending', async () => {
    // Create first outline
    const firstOutline = await db.insert(contentOutlinesTable)
      .values({ ...testOutlineInput })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second outline
    const secondOutline = await db.insert(contentOutlinesTable)
      .values({ ...secondOutlineInput })
      .returning()
      .execute();

    const result = await getContentOutlines();

    expect(result).toHaveLength(2);
    
    // Verify newer outline comes first
    expect(result[0].id).toEqual(secondOutline[0].id);
    expect(result[1].id).toEqual(firstOutline[0].id);
    
    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
  });

  it('should include all required fields in response', async () => {
    await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        secondary_keywords: null, // Test nullable field
        meta_description: null,   // Test nullable field
        seo_suggestions: null     // Test nullable field
      })
      .execute();

    const result = await getContentOutlines();

    expect(result).toHaveLength(1);
    const outline = result[0];
    
    // Required fields
    expect(outline.id).toBeDefined();
    expect(outline.title).toEqual('Ultimate Guide to SEO');
    expect(outline.target_keyword).toEqual('seo guide');
    expect(outline.word_count_target).toEqual(2500);
    expect(outline.outline_structure).toBeDefined();
    expect(outline.content_type).toEqual('guide');
    expect(outline.difficulty_level).toEqual('intermediate');
    expect(outline.estimated_reading_time).toEqual(12);
    expect(outline.created_at).toBeInstanceOf(Date);
    expect(outline.updated_at).toBeInstanceOf(Date);
    
    // Nullable fields
    expect(outline.secondary_keywords).toBeNull();
    expect(outline.meta_description).toBeNull();
    expect(outline.seo_suggestions).toBeNull();
  });

  it('should handle JSON string fields correctly', async () => {
    await db.insert(contentOutlinesTable)
      .values({ ...testOutlineInput })
      .execute();

    const result = await getContentOutlines();

    expect(result).toHaveLength(1);
    const outline = result[0];
    
    // JSON fields should be returned as strings (not parsed)
    expect(typeof outline.secondary_keywords).toBe('string');
    expect(typeof outline.outline_structure).toBe('string');
    expect(typeof outline.seo_suggestions).toBe('string');
    
    // Verify JSON content is valid
    const secondaryKeywords = JSON.parse(outline.secondary_keywords!);
    expect(secondaryKeywords).toEqual(['seo tips', 'search optimization', 'ranking factors']);
    
    const outlineStructure = JSON.parse(outline.outline_structure);
    expect(outlineStructure).toHaveProperty('Introduction');
    expect(outlineStructure).toHaveProperty('Basics');
  });

  it('should verify database persistence', async () => {
    // Create outline via handler's database access
    await db.insert(contentOutlinesTable)
      .values({ ...testOutlineInput })
      .execute();

    // Fetch via handler
    const result = await getContentOutlines();

    // Verify database state directly
    const dbOutlines = await db.select()
      .from(contentOutlinesTable)
      .orderBy(desc(contentOutlinesTable.created_at))
      .execute();

    expect(result).toHaveLength(dbOutlines.length);
    expect(result[0].id).toEqual(dbOutlines[0].id);
    expect(result[0].title).toEqual(dbOutlines[0].title);
    expect(result[0].created_at).toEqual(dbOutlines[0].created_at);
  });
});