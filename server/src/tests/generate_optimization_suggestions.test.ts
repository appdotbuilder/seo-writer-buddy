import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable, optimizationSuggestionsTable } from '../db/schema';
import { type CreateContentOutlineInput } from '../schema';
import { generateOptimizationSuggestions } from '../handlers/generate_optimization_suggestions';
import { eq } from 'drizzle-orm';

// Test content outline with various optimization issues
const testOutlineInput: CreateContentOutlineInput = {
  title: 'This is a very long title that exceeds the recommended 60 character limit for SEO optimization',
  target_keyword: 'SEO optimization',
  secondary_keywords: JSON.stringify(['keyword research', 'content marketing', 'search rankings']),
  meta_description: 'This is a very long meta description that exceeds the recommended 160 character limit which may cause truncation in search engine results pages and reduce click-through rates',
  word_count_target: 1500,
  outline_structure: JSON.stringify({
    h1: 'Main Title',
    h2: ['Section 1', 'Section 2'],
    h3: ['Subsection 1.1', 'Subsection 2.1']
  }),
  seo_suggestions: null,
  content_type: 'blog_post',
  difficulty_level: 'intermediate',
  estimated_reading_time: 8
};

const shortTitleOutline: CreateContentOutlineInput = {
  title: 'Short Title',
  target_keyword: 'test keyword',
  secondary_keywords: null,
  meta_description: null,
  word_count_target: 200,
  outline_structure: JSON.stringify({ h1: 'Title' }),
  seo_suggestions: null,
  content_type: 'article',
  difficulty_level: 'beginner',
  estimated_reading_time: 2
};

const optimizedOutline: CreateContentOutlineInput = {
  title: 'Perfect SEO Guide: Complete SEO Optimization Tips',
  target_keyword: 'SEO optimization',
  secondary_keywords: JSON.stringify(['SEO tips', 'search engine']),
  meta_description: 'Learn complete SEO optimization techniques with this comprehensive guide. Improve your search rankings today.',
  word_count_target: 1000,
  outline_structure: JSON.stringify({
    h1: 'SEO Optimization Guide',
    h2: ['SEO Basics', 'Advanced Techniques']
  }),
  seo_suggestions: null,
  content_type: 'guide',
  difficulty_level: 'intermediate',
  estimated_reading_time: 5
};

describe('generateOptimizationSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should throw error for non-existent content outline', async () => {
    await expect(generateOptimizationSuggestions(999)).rejects.toThrow(/Content outline with id 999 not found/i);
  });

  it('should generate comprehensive suggestions for problematic content outline', async () => {
    // Create test content outline
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const outlineId = result[0].id;

    // Generate suggestions
    const suggestions = await generateOptimizationSuggestions(outlineId);

    // Should generate multiple suggestions
    expect(suggestions.length).toBeGreaterThan(5);

    // Check that suggestions are saved to database
    const savedSuggestions = await db.select()
      .from(optimizationSuggestionsTable)
      .where(eq(optimizationSuggestionsTable.content_outline_id, outlineId))
      .execute();

    expect(savedSuggestions).toHaveLength(suggestions.length);

    // Verify numeric conversion
    suggestions.forEach(suggestion => {
      expect(typeof suggestion.impact_score).toBe('number');
      expect(suggestion.impact_score).toBeGreaterThan(0);
      expect(suggestion.impact_score).toBeLessThanOrEqual(100);
    });
  });

  it('should generate title optimization suggestions', async () => {
    // Create outline with long title
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    // Should have title suggestions
    const titleSuggestions = suggestions.filter(s => s.suggestion_type === 'title');
    expect(titleSuggestions.length).toBeGreaterThan(0);

    // Should identify long title issue
    const longTitleSuggestion = titleSuggestions.find(s => 
      s.suggestion.includes('too long')
    );
    expect(longTitleSuggestion).toBeDefined();
    expect(longTitleSuggestion!.priority).toBe('high');
    expect(longTitleSuggestion!.impact_score).toBeGreaterThan(80);
  });

  it('should generate suggestions for short title', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...shortTitleOutline,
        word_count_target: shortTitleOutline.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const titleSuggestions = suggestions.filter(s => s.suggestion_type === 'title');
    
    // Should suggest expanding short title
    const shortTitleSuggestion = titleSuggestions.find(s => 
      s.suggestion.includes('too short')
    );
    expect(shortTitleSuggestion).toBeDefined();
    expect(shortTitleSuggestion!.priority).toBe('medium');
  });

  it('should generate meta description suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const metaSuggestions = suggestions.filter(s => s.suggestion_type === 'meta_description');
    expect(metaSuggestions.length).toBeGreaterThan(0);

    // Should identify long meta description
    const longMetaSuggestion = metaSuggestions.find(s => 
      s.suggestion.includes('too long')
    );
    expect(longMetaSuggestion).toBeDefined();
  });

  it('should generate suggestions for missing meta description', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...shortTitleOutline,
        word_count_target: shortTitleOutline.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const metaSuggestions = suggestions.filter(s => s.suggestion_type === 'meta_description');
    
    // Should suggest adding meta description
    const missingMetaSuggestion = metaSuggestions.find(s => 
      s.suggestion.includes('Add a meta description')
    );
    expect(missingMetaSuggestion).toBeDefined();
    expect(missingMetaSuggestion!.priority).toBe('high');
    expect(missingMetaSuggestion!.current_value).toBeNull();
  });

  it('should generate heading structure suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const headingSuggestions = suggestions.filter(s => s.suggestion_type === 'headings');
    expect(headingSuggestions.length).toBeGreaterThan(0);

    const headingSuggestion = headingSuggestions[0];
    expect(headingSuggestion.suggestion).toContain('H1-H6');
    expect(headingSuggestion.suggestion_type).toBe('headings');
  });

  it('should generate internal linking suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const linkingSuggestions = suggestions.filter(s => s.suggestion_type === 'internal_links');
    expect(linkingSuggestions.length).toBeGreaterThan(0);

    const linkingSuggestion = linkingSuggestions[0];
    expect(linkingSuggestion.suggestion).toContain('internal links');
    expect(linkingSuggestion.recommended_value).toContain('3-5');
  });

  it('should generate image optimization suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const imageSuggestions = suggestions.filter(s => s.suggestion_type === 'images');
    expect(imageSuggestions.length).toBeGreaterThan(0);

    const imageSuggestion = imageSuggestions[0];
    expect(imageSuggestion.suggestion).toContain('alt text');
    expect(imageSuggestion.recommended_value).toContain(testOutlineInput.target_keyword);
  });

  it('should generate keyword density suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const keywordSuggestions = suggestions.filter(s => s.suggestion_type === 'keyword_density');
    expect(keywordSuggestions.length).toBeGreaterThan(0);

    // Should have suggestions for both primary and secondary keywords
    const primaryKeywordSuggestion = keywordSuggestions.find(s => 
      s.suggestion.includes('1-2%')
    );
    expect(primaryKeywordSuggestion).toBeDefined();

    const secondaryKeywordSuggestion = keywordSuggestions.find(s => 
      s.suggestion.includes('secondary keywords')
    );
    expect(secondaryKeywordSuggestion).toBeDefined();
  });

  it('should generate readability suggestions based on difficulty level', async () => {
    // Test beginner level
    const beginnerResult = await db.insert(contentOutlinesTable)
      .values({
        ...shortTitleOutline,
        word_count_target: shortTitleOutline.word_count_target
      })
      .returning()
      .execute();

    const beginnerSuggestions = await generateOptimizationSuggestions(beginnerResult[0].id);
    const beginnerReadability = beginnerSuggestions.filter(s => s.suggestion_type === 'readability');
    
    const beginnerLevelSuggestion = beginnerReadability.find(s => 
      s.recommended_value?.includes('Grade 6-8')
    );
    expect(beginnerLevelSuggestion).toBeDefined();

    // Should also suggest increasing word count for short content
    const wordCountSuggestion = beginnerReadability.find(s => 
      s.suggestion.includes('Increase word count')
    );
    expect(wordCountSuggestion).toBeDefined();
    expect(wordCountSuggestion!.priority).toBe('high');
  });

  it('should handle missing target keyword in title', async () => {
    // Create outline where title doesn't contain target keyword
    const noKeywordOutline = {
      ...testOutlineInput,
      title: 'Complete Guide to Content Marketing Success',
      target_keyword: 'SEO optimization'
    };

    const result = await db.insert(contentOutlinesTable)
      .values({
        ...noKeywordOutline,
        word_count_target: noKeywordOutline.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    const titleSuggestions = suggestions.filter(s => s.suggestion_type === 'title');
    
    const keywordSuggestion = titleSuggestions.find(s => 
      s.suggestion.includes('Include the target keyword')
    );
    expect(keywordSuggestion).toBeDefined();
    expect(keywordSuggestion!.priority).toBe('high');
    expect(keywordSuggestion!.impact_score).toBe(90);
  });

  it('should generate fewer suggestions for well-optimized content', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...optimizedOutline,
        word_count_target: optimizedOutline.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    // Should still generate some suggestions (internal links, images, etc.)
    // but fewer critical/high priority ones
    expect(suggestions.length).toBeGreaterThan(3);
    
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
    // Well-optimized content should have fewer high priority suggestions
    expect(highPrioritySuggestions.length).toBeLessThan(3);
  });

  it('should set all suggestions as not implemented initially', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const suggestions = await generateOptimizationSuggestions(result[0].id);

    suggestions.forEach(suggestion => {
      expect(suggestion.is_implemented).toBe(false);
    });
  });

  it('should assign correct content_outline_id to all suggestions', async () => {
    const result = await db.insert(contentOutlinesTable)
      .values({
        ...testOutlineInput,
        word_count_target: testOutlineInput.word_count_target
      })
      .returning()
      .execute();

    const outlineId = result[0].id;
    const suggestions = await generateOptimizationSuggestions(outlineId);

    suggestions.forEach(suggestion => {
      expect(suggestion.content_outline_id).toBe(outlineId);
    });
  });
});