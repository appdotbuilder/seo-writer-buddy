import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type CreateContentOutlineInput } from '../schema';
import { createContentOutline } from '../handlers/create_content_outline';
import { eq, gte, between, and } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateContentOutlineInput = {
  title: 'Complete Guide to SEO Content Writing',
  target_keyword: 'SEO content writing',
  secondary_keywords: '["content marketing", "SEO optimization", "blog writing"]',
  meta_description: 'Learn how to write SEO-optimized content that ranks higher in search results',
  word_count_target: 2500,
  outline_structure: JSON.stringify({
    sections: [
      { heading: 'Introduction', subheadings: ['What is SEO content writing', 'Why it matters'] },
      { heading: 'SEO Basics', subheadings: ['Keyword research', 'On-page optimization'] },
      { heading: 'Writing Techniques', subheadings: ['Structure', 'Readability'] },
      { heading: 'Conclusion', subheadings: ['Key takeaways', 'Next steps'] }
    ]
  }),
  seo_suggestions: '["Use target keyword in H1", "Add internal links", "Optimize meta description"]',
  content_type: 'guide',
  difficulty_level: 'intermediate',
  estimated_reading_time: 12
};

// Minimal test input
const minimalInput: CreateContentOutlineInput = {
  title: 'Basic Blog Post',
  target_keyword: 'blogging tips',
  secondary_keywords: null,
  meta_description: null,
  word_count_target: 800,
  outline_structure: '{"sections": [{"heading": "Introduction"}, {"heading": "Conclusion"}]}',
  seo_suggestions: null,
  content_type: 'blog_post',
  difficulty_level: 'beginner',
  estimated_reading_time: 4
};

describe('createContentOutline', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a content outline with complete data', async () => {
    const result = await createContentOutline(testInput);

    // Basic field validation
    expect(result.title).toEqual('Complete Guide to SEO Content Writing');
    expect(result.target_keyword).toEqual('SEO content writing');
    expect(result.secondary_keywords).toEqual(testInput.secondary_keywords);
    expect(result.meta_description).toEqual(testInput.meta_description);
    expect(result.word_count_target).toEqual(2500);
    expect(result.outline_structure).toEqual(testInput.outline_structure);
    expect(result.seo_suggestions).toEqual(testInput.seo_suggestions);
    expect(result.content_type).toEqual('guide');
    expect(result.difficulty_level).toEqual('intermediate');
    expect(result.estimated_reading_time).toEqual(12);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a content outline with minimal data', async () => {
    const result = await createContentOutline(minimalInput);

    expect(result.title).toEqual('Basic Blog Post');
    expect(result.target_keyword).toEqual('blogging tips');
    expect(result.secondary_keywords).toBeNull();
    expect(result.meta_description).toBeNull();
    expect(result.word_count_target).toEqual(800);
    expect(result.content_type).toEqual('blog_post');
    expect(result.difficulty_level).toEqual('beginner');
    expect(result.estimated_reading_time).toEqual(4);
    expect(result.seo_suggestions).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save content outline to database', async () => {
    const result = await createContentOutline(testInput);

    // Query using proper drizzle syntax
    const contentOutlines = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, result.id))
      .execute();

    expect(contentOutlines).toHaveLength(1);
    const saved = contentOutlines[0];
    expect(saved.title).toEqual('Complete Guide to SEO Content Writing');
    expect(saved.target_keyword).toEqual('SEO content writing');
    expect(saved.word_count_target).toEqual(2500);
    expect(saved.content_type).toEqual('guide');
    expect(saved.difficulty_level).toEqual('intermediate');
    expect(saved.estimated_reading_time).toEqual(12);
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different content types correctly', async () => {
    const reviewInput: CreateContentOutlineInput = {
      ...minimalInput,
      title: 'Product Review Template',
      content_type: 'review',
      difficulty_level: 'advanced'
    };

    const result = await createContentOutline(reviewInput);

    expect(result.content_type).toEqual('review');
    expect(result.difficulty_level).toEqual('advanced');
    expect(result.title).toEqual('Product Review Template');
  });

  it('should handle JSON string fields properly', async () => {
    const complexOutlineStructure = JSON.stringify({
      sections: [
        {
          heading: 'Advanced SEO Techniques',
          subheadings: [
            'Schema markup implementation',
            'Core Web Vitals optimization',
            'Featured snippet targeting'
          ],
          wordCount: 800
        },
        {
          heading: 'Technical SEO',
          subheadings: [
            'Site speed optimization',
            'Mobile-first indexing',
            'URL structure'
          ],
          wordCount: 600
        }
      ],
      totalSections: 2,
      estimatedWords: 1400
    });

    const complexSeoSuggestions = JSON.stringify([
      {
        type: 'keyword_density',
        suggestion: 'Maintain 1-2% keyword density for target keyword',
        priority: 'high'
      },
      {
        type: 'internal_links',
        suggestion: 'Add 3-5 internal links to related articles',
        priority: 'medium'
      }
    ]);

    const complexInput: CreateContentOutlineInput = {
      ...testInput,
      title: 'Advanced SEO Guide',
      outline_structure: complexOutlineStructure,
      seo_suggestions: complexSeoSuggestions,
      word_count_target: 1500
    };

    const result = await createContentOutline(complexInput);

    expect(result.outline_structure).toEqual(complexOutlineStructure);
    expect(result.seo_suggestions).toEqual(complexSeoSuggestions);
    expect(result.word_count_target).toEqual(1500);

    // Verify JSON can be parsed back
    expect(() => JSON.parse(result.outline_structure)).not.toThrow();
    expect(() => JSON.parse(result.seo_suggestions!)).not.toThrow();
  });

  it('should query content outlines by date range correctly', async () => {
    // Create test content outline
    await createContentOutline(testInput);

    // Test date filtering - use a wider date range to ensure we capture the record
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - apply where clause directly
    const contentOutlines = await db.select()
      .from(contentOutlinesTable)
      .where(
        and(
          gte(contentOutlinesTable.created_at, yesterday),
          between(contentOutlinesTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(contentOutlines.length).toBeGreaterThan(0);
    contentOutlines.forEach(outline => {
      expect(outline.created_at).toBeInstanceOf(Date);
      expect(outline.created_at >= yesterday).toBe(true);
      expect(outline.created_at <= tomorrow).toBe(true);
    });
  });

  it('should create multiple content outlines with different types', async () => {
    const inputs: CreateContentOutlineInput[] = [
      { ...testInput, content_type: 'blog_post', title: 'Blog Post Example' },
      { ...testInput, content_type: 'article', title: 'Article Example' },
      { ...testInput, content_type: 'tutorial', title: 'Tutorial Example' }
    ];

    const results = await Promise.all(
      inputs.map(input => createContentOutline(input))
    );

    expect(results).toHaveLength(3);
    expect(results[0].content_type).toEqual('blog_post');
    expect(results[1].content_type).toEqual('article');
    expect(results[2].content_type).toEqual('tutorial');
    expect(results[0].title).toEqual('Blog Post Example');
    expect(results[1].title).toEqual('Article Example');
    expect(results[2].title).toEqual('Tutorial Example');
  });

  it('should handle large word count targets', async () => {
    const longFormInput: CreateContentOutlineInput = {
      ...testInput,
      title: 'Comprehensive SEO Guide',
      word_count_target: 10000,
      estimated_reading_time: 45
    };

    const result = await createContentOutline(longFormInput);

    expect(result.word_count_target).toEqual(10000);
    expect(result.estimated_reading_time).toEqual(45);
    expect(result.title).toEqual('Comprehensive SEO Guide');
  });
});