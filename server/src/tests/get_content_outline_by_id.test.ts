import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type CreateContentOutlineInput } from '../schema';
import { getContentOutlineById } from '../handlers/get_content_outline_by_id';

// Test content outline data
const testContentOutlineInput: CreateContentOutlineInput = {
  title: 'Complete Guide to Content Marketing',
  target_keyword: 'content marketing guide',
  secondary_keywords: '["content strategy", "digital marketing", "content creation"]',
  meta_description: 'Learn everything about content marketing with this comprehensive guide including strategies and best practices.',
  word_count_target: 2500,
  outline_structure: '{"sections": [{"heading": "Introduction", "subsections": ["What is Content Marketing", "Why it Matters"]}, {"heading": "Strategy", "subsections": ["Planning", "Execution"]}]}',
  seo_suggestions: '["Use target keyword in H1", "Include related keywords in subheadings", "Add internal links"]',
  content_type: 'guide',
  difficulty_level: 'intermediate',
  estimated_reading_time: 12
};

const minimalContentOutlineInput: CreateContentOutlineInput = {
  title: 'Basic SEO Tips',
  target_keyword: 'seo tips',
  secondary_keywords: null,
  meta_description: null,
  word_count_target: 800,
  outline_structure: '{"sections": [{"heading": "Introduction"}, {"heading": "Tips"}]}',
  seo_suggestions: null,
  content_type: 'blog_post',
  difficulty_level: 'beginner',
  estimated_reading_time: 4
};

describe('getContentOutlineById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return content outline by id', async () => {
    // Create test content outline
    const inserted = await db.insert(contentOutlinesTable)
      .values({
        title: testContentOutlineInput.title,
        target_keyword: testContentOutlineInput.target_keyword,
        secondary_keywords: testContentOutlineInput.secondary_keywords,
        meta_description: testContentOutlineInput.meta_description,
        word_count_target: testContentOutlineInput.word_count_target,
        outline_structure: testContentOutlineInput.outline_structure,
        seo_suggestions: testContentOutlineInput.seo_suggestions,
        content_type: testContentOutlineInput.content_type,
        difficulty_level: testContentOutlineInput.difficulty_level,
        estimated_reading_time: testContentOutlineInput.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = inserted[0].id;

    // Test the handler
    const result = await getContentOutlineById(contentOutlineId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(contentOutlineId);
    expect(result!.title).toEqual('Complete Guide to Content Marketing');
    expect(result!.target_keyword).toEqual('content marketing guide');
    expect(result!.secondary_keywords).toEqual('["content strategy", "digital marketing", "content creation"]');
    expect(result!.meta_description).toEqual('Learn everything about content marketing with this comprehensive guide including strategies and best practices.');
    expect(result!.word_count_target).toEqual(2500);
    expect(result!.outline_structure).toEqual('{"sections": [{"heading": "Introduction", "subsections": ["What is Content Marketing", "Why it Matters"]}, {"heading": "Strategy", "subsections": ["Planning", "Execution"]}]}');
    expect(result!.seo_suggestions).toEqual('["Use target keyword in H1", "Include related keywords in subheadings", "Add internal links"]');
    expect(result!.content_type).toEqual('guide');
    expect(result!.difficulty_level).toEqual('intermediate');
    expect(result!.estimated_reading_time).toEqual(12);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return content outline with minimal data', async () => {
    // Create minimal test content outline
    const inserted = await db.insert(contentOutlinesTable)
      .values({
        title: minimalContentOutlineInput.title,
        target_keyword: minimalContentOutlineInput.target_keyword,
        secondary_keywords: minimalContentOutlineInput.secondary_keywords,
        meta_description: minimalContentOutlineInput.meta_description,
        word_count_target: minimalContentOutlineInput.word_count_target,
        outline_structure: minimalContentOutlineInput.outline_structure,
        seo_suggestions: minimalContentOutlineInput.seo_suggestions,
        content_type: minimalContentOutlineInput.content_type,
        difficulty_level: minimalContentOutlineInput.difficulty_level,
        estimated_reading_time: minimalContentOutlineInput.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = inserted[0].id;

    // Test the handler
    const result = await getContentOutlineById(contentOutlineId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(contentOutlineId);
    expect(result!.title).toEqual('Basic SEO Tips');
    expect(result!.target_keyword).toEqual('seo tips');
    expect(result!.secondary_keywords).toBeNull();
    expect(result!.meta_description).toBeNull();
    expect(result!.word_count_target).toEqual(800);
    expect(result!.seo_suggestions).toBeNull();
    expect(result!.content_type).toEqual('blog_post');
    expect(result!.difficulty_level).toEqual('beginner');
    expect(result!.estimated_reading_time).toEqual(4);
  });

  it('should return null for non-existent content outline', async () => {
    const result = await getContentOutlineById(999999);
    expect(result).toBeNull();
  });

  it('should handle different content types and difficulty levels', async () => {
    const testCases = [
      { content_type: 'article', difficulty_level: 'advanced' },
      { content_type: 'tutorial', difficulty_level: 'beginner' },
      { content_type: 'review', difficulty_level: 'intermediate' }
    ] as const;

    for (const testCase of testCases) {
      const inserted = await db.insert(contentOutlinesTable)
        .values({
          title: `Test ${testCase.content_type}`,
          target_keyword: 'test keyword',
          secondary_keywords: null,
          meta_description: null,
          word_count_target: 1000,
          outline_structure: '{"sections": []}',
          seo_suggestions: null,
          content_type: testCase.content_type,
          difficulty_level: testCase.difficulty_level,
          estimated_reading_time: 5
        })
        .returning()
        .execute();

      const result = await getContentOutlineById(inserted[0].id);

      expect(result).not.toBeNull();
      expect(result!.content_type).toEqual(testCase.content_type);
      expect(result!.difficulty_level).toEqual(testCase.difficulty_level);
    }
  });

  it('should preserve integer field types correctly', async () => {
    const inserted = await db.insert(contentOutlinesTable)
      .values({
        title: 'Type Test Content',
        target_keyword: 'type test',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1500,
        outline_structure: '{"sections": []}',
        seo_suggestions: null,
        content_type: 'article',
        difficulty_level: 'intermediate',
        estimated_reading_time: 8
      })
      .returning()
      .execute();

    const result = await getContentOutlineById(inserted[0].id);

    expect(result).not.toBeNull();
    expect(typeof result!.word_count_target).toBe('number');
    expect(typeof result!.estimated_reading_time).toBe('number');
    expect(typeof result!.id).toBe('number');
    expect(result!.word_count_target).toEqual(1500);
    expect(result!.estimated_reading_time).toEqual(8);
  });
});