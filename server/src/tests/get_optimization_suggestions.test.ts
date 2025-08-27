import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable, optimizationSuggestionsTable } from '../db/schema';
import { getOptimizationSuggestions } from '../handlers/get_optimization_suggestions';

describe('getOptimizationSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no suggestions exist', async () => {
    // Create a content outline first
    const contentOutline = await db.insert(contentOutlinesTable)
      .values({
        title: 'Test Content',
        target_keyword: 'test keyword',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1000,
        outline_structure: '{"headings": ["Introduction", "Conclusion"]}',
        seo_suggestions: null,
        content_type: 'blog_post',
        difficulty_level: 'beginner',
        estimated_reading_time: 5
      })
      .returning()
      .execute();

    const result = await getOptimizationSuggestions(contentOutline[0].id);

    expect(result).toEqual([]);
  });

  it('should return optimization suggestions for a content outline', async () => {
    // Create a content outline first
    const contentOutline = await db.insert(contentOutlinesTable)
      .values({
        title: 'Test Content',
        target_keyword: 'test keyword',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1000,
        outline_structure: '{"headings": ["Introduction", "Conclusion"]}',
        seo_suggestions: null,
        content_type: 'blog_post',
        difficulty_level: 'beginner',
        estimated_reading_time: 5
      })
      .returning()
      .execute();

    // Create optimization suggestions
    const suggestions = await db.insert(optimizationSuggestionsTable)
      .values([
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'title',
          priority: 'high',
          suggestion: 'Include target keyword in title',
          current_value: 'Generic Title',
          recommended_value: 'Test Keyword - Complete Guide',
          impact_score: '85.5',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'meta_description',
          priority: 'medium',
          suggestion: 'Add compelling meta description',
          current_value: null,
          recommended_value: 'Learn about test keyword with our comprehensive guide',
          impact_score: '75.0',
          is_implemented: true
        }
      ])
      .returning()
      .execute();

    const result = await getOptimizationSuggestions(contentOutline[0].id);

    expect(result).toHaveLength(2);
    
    // Verify first suggestion
    expect(result[0].suggestion_type).toEqual('title');
    expect(result[0].priority).toEqual('high');
    expect(result[0].suggestion).toEqual('Include target keyword in title');
    expect(result[0].current_value).toEqual('Generic Title');
    expect(result[0].recommended_value).toEqual('Test Keyword - Complete Guide');
    expect(result[0].impact_score).toEqual(85.5);
    expect(typeof result[0].impact_score).toBe('number');
    expect(result[0].is_implemented).toBe(false);
    expect(result[0].content_outline_id).toEqual(contentOutline[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second suggestion
    expect(result[1].suggestion_type).toEqual('meta_description');
    expect(result[1].priority).toEqual('medium');
    expect(result[1].current_value).toBeNull();
    expect(result[1].impact_score).toEqual(75.0);
    expect(typeof result[1].impact_score).toBe('number');
    expect(result[1].is_implemented).toBe(true);
  });

  it('should filter suggestions by content outline id', async () => {
    // Create two content outlines
    const contentOutline1 = await db.insert(contentOutlinesTable)
      .values({
        title: 'First Content',
        target_keyword: 'first keyword',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1000,
        outline_structure: '{"headings": ["Introduction"]}',
        seo_suggestions: null,
        content_type: 'article',
        difficulty_level: 'beginner',
        estimated_reading_time: 5
      })
      .returning()
      .execute();

    const contentOutline2 = await db.insert(contentOutlinesTable)
      .values({
        title: 'Second Content',
        target_keyword: 'second keyword',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 2000,
        outline_structure: '{"headings": ["Overview"]}',
        seo_suggestions: null,
        content_type: 'guide',
        difficulty_level: 'intermediate',
        estimated_reading_time: 10
      })
      .returning()
      .execute();

    // Create suggestions for both outlines
    await db.insert(optimizationSuggestionsTable)
      .values([
        {
          content_outline_id: contentOutline1[0].id,
          suggestion_type: 'title',
          priority: 'high',
          suggestion: 'First suggestion',
          current_value: null,
          recommended_value: null,
          impact_score: '80.0',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline2[0].id,
          suggestion_type: 'headings',
          priority: 'low',
          suggestion: 'Second suggestion',
          current_value: null,
          recommended_value: null,
          impact_score: '60.0',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline1[0].id,
          suggestion_type: 'images',
          priority: 'medium',
          suggestion: 'Third suggestion for first outline',
          current_value: null,
          recommended_value: null,
          impact_score: '70.0',
          is_implemented: true
        }
      ])
      .execute();

    // Get suggestions for first outline only
    const result = await getOptimizationSuggestions(contentOutline1[0].id);

    expect(result).toHaveLength(2);
    result.forEach(suggestion => {
      expect(suggestion.content_outline_id).toEqual(contentOutline1[0].id);
    });

    // Verify specific suggestions
    const titleSuggestion = result.find(s => s.suggestion_type === 'title');
    const imageSuggestion = result.find(s => s.suggestion_type === 'images');
    
    expect(titleSuggestion).toBeDefined();
    expect(titleSuggestion?.suggestion).toEqual('First suggestion');
    expect(titleSuggestion?.impact_score).toEqual(80.0);
    
    expect(imageSuggestion).toBeDefined();
    expect(imageSuggestion?.suggestion).toEqual('Third suggestion for first outline');
    expect(imageSuggestion?.is_implemented).toBe(true);
  });

  it('should handle non-existent content outline id', async () => {
    const result = await getOptimizationSuggestions(999);

    expect(result).toEqual([]);
  });

  it('should handle all suggestion types and priorities correctly', async () => {
    // Create content outline
    const contentOutline = await db.insert(contentOutlinesTable)
      .values({
        title: 'Comprehensive Test',
        target_keyword: 'comprehensive test',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1500,
        outline_structure: '{"headings": ["Start", "Middle", "End"]}',
        seo_suggestions: null,
        content_type: 'tutorial',
        difficulty_level: 'advanced',
        estimated_reading_time: 8
      })
      .returning()
      .execute();

    // Create suggestions with all types and priorities
    await db.insert(optimizationSuggestionsTable)
      .values([
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'title',
          priority: 'high',
          suggestion: 'Title suggestion',
          current_value: 'Old title',
          recommended_value: 'New title',
          impact_score: '95.75',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'meta_description',
          priority: 'medium',
          suggestion: 'Meta description suggestion',
          current_value: null,
          recommended_value: 'New meta description',
          impact_score: '82.25',
          is_implemented: true
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'headings',
          priority: 'low',
          suggestion: 'Headings suggestion',
          current_value: 'H2: Basic heading',
          recommended_value: 'H2: Keyword-rich heading',
          impact_score: '68.5',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'internal_links',
          priority: 'high',
          suggestion: 'Internal links suggestion',
          current_value: null,
          recommended_value: null,
          impact_score: '88.0',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'images',
          priority: 'medium',
          suggestion: 'Images optimization',
          current_value: 'No alt text',
          recommended_value: 'Descriptive alt text with keyword',
          impact_score: '72.3',
          is_implemented: true
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'keyword_density',
          priority: 'low',
          suggestion: 'Keyword density optimization',
          current_value: '0.5%',
          recommended_value: '1.2%',
          impact_score: '65.8',
          is_implemented: false
        },
        {
          content_outline_id: contentOutline[0].id,
          suggestion_type: 'readability',
          priority: 'medium',
          suggestion: 'Improve readability score',
          current_value: 'Hard to read',
          recommended_value: 'Easy to read',
          impact_score: '78.9',
          is_implemented: true
        }
      ])
      .execute();

    const result = await getOptimizationSuggestions(contentOutline[0].id);

    expect(result).toHaveLength(7);

    // Verify all suggestion types are present
    const suggestionTypes = result.map(s => s.suggestion_type);
    expect(suggestionTypes).toContain('title');
    expect(suggestionTypes).toContain('meta_description');
    expect(suggestionTypes).toContain('headings');
    expect(suggestionTypes).toContain('internal_links');
    expect(suggestionTypes).toContain('images');
    expect(suggestionTypes).toContain('keyword_density');
    expect(suggestionTypes).toContain('readability');

    // Verify all priorities are present
    const priorities = result.map(s => s.priority);
    expect(priorities).toContain('high');
    expect(priorities).toContain('medium');
    expect(priorities).toContain('low');

    // Verify numeric conversion for all decimal values
    result.forEach(suggestion => {
      expect(typeof suggestion.impact_score).toBe('number');
      expect(suggestion.impact_score).toBeGreaterThanOrEqual(0);
      expect(suggestion.impact_score).toBeLessThanOrEqual(100);
    });

    // Verify specific decimal precision
    const titleSuggestion = result.find(s => s.suggestion_type === 'title');
    expect(titleSuggestion?.impact_score).toEqual(95.75);

    const readabilitySuggestion = result.find(s => s.suggestion_type === 'readability');
    expect(readabilitySuggestion?.impact_score).toEqual(78.9);
  });
});