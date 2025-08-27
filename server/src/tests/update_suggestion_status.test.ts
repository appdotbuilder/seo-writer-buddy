import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable, optimizationSuggestionsTable } from '../db/schema';
import { type CreateContentOutlineInput, type CreateOptimizationSuggestionInput } from '../schema';
import { updateSuggestionStatus } from '../handlers/update_suggestion_status';
import { eq } from 'drizzle-orm';

// Test data for content outline (required for optimization suggestions)
const testContentOutline: CreateContentOutlineInput = {
  title: 'SEO Best Practices Guide',
  target_keyword: 'seo optimization',
  secondary_keywords: '["search engine optimization", "seo tips"]',
  meta_description: 'Complete guide to SEO optimization techniques',
  word_count_target: 2000,
  outline_structure: '{"sections": [{"title": "Introduction", "subsections": ["What is SEO"]}]}',
  seo_suggestions: '["Use target keyword in title", "Add internal links"]',
  content_type: 'guide',
  difficulty_level: 'intermediate',
  estimated_reading_time: 10
};

// Test data for optimization suggestion
const testSuggestion: CreateOptimizationSuggestionInput = {
  content_outline_id: 1, // Will be set after creating content outline
  suggestion_type: 'title',
  priority: 'high',
  suggestion: 'Include target keyword in the title',
  current_value: 'Best Practices Guide',
  recommended_value: 'SEO Best Practices Guide - Complete Optimization Tutorial',
  impact_score: 85.5,
  is_implemented: false
};

describe('updateSuggestionStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update suggestion status to implemented', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values({
        title: testContentOutline.title,
        target_keyword: testContentOutline.target_keyword,
        secondary_keywords: testContentOutline.secondary_keywords,
        meta_description: testContentOutline.meta_description,
        word_count_target: testContentOutline.word_count_target,
        outline_structure: testContentOutline.outline_structure,
        seo_suggestions: testContentOutline.seo_suggestions,
        content_type: testContentOutline.content_type,
        difficulty_level: testContentOutline.difficulty_level,
        estimated_reading_time: testContentOutline.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = contentOutlineResult[0].id;

    // Create optimization suggestion
    const suggestionResult = await db.insert(optimizationSuggestionsTable)
      .values({
        content_outline_id: contentOutlineId,
        suggestion_type: testSuggestion.suggestion_type,
        priority: testSuggestion.priority,
        suggestion: testSuggestion.suggestion,
        current_value: testSuggestion.current_value,
        recommended_value: testSuggestion.recommended_value,
        impact_score: testSuggestion.impact_score.toString(),
        is_implemented: testSuggestion.is_implemented
      })
      .returning()
      .execute();

    const suggestionId = suggestionResult[0].id;

    // Update suggestion status to implemented
    const result = await updateSuggestionStatus(suggestionId, true);

    // Verify the returned result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(suggestionId);
    expect(result!.is_implemented).toEqual(true);
    expect(result!.suggestion).toEqual(testSuggestion.suggestion);
    expect(result!.impact_score).toEqual(85.5);
    expect(typeof result!.impact_score).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update suggestion status to not implemented', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values({
        title: testContentOutline.title,
        target_keyword: testContentOutline.target_keyword,
        secondary_keywords: testContentOutline.secondary_keywords,
        meta_description: testContentOutline.meta_description,
        word_count_target: testContentOutline.word_count_target,
        outline_structure: testContentOutline.outline_structure,
        seo_suggestions: testContentOutline.seo_suggestions,
        content_type: testContentOutline.content_type,
        difficulty_level: testContentOutline.difficulty_level,
        estimated_reading_time: testContentOutline.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = contentOutlineResult[0].id;

    // Create optimization suggestion that starts as implemented
    const suggestionResult = await db.insert(optimizationSuggestionsTable)
      .values({
        content_outline_id: contentOutlineId,
        suggestion_type: testSuggestion.suggestion_type,
        priority: testSuggestion.priority,
        suggestion: testSuggestion.suggestion,
        current_value: testSuggestion.current_value,
        recommended_value: testSuggestion.recommended_value,
        impact_score: testSuggestion.impact_score.toString(),
        is_implemented: true // Start as implemented
      })
      .returning()
      .execute();

    const suggestionId = suggestionResult[0].id;

    // Update suggestion status to not implemented
    const result = await updateSuggestionStatus(suggestionId, false);

    // Verify the returned result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(suggestionId);
    expect(result!.is_implemented).toEqual(false);
    expect(result!.suggestion).toEqual(testSuggestion.suggestion);
    expect(result!.impact_score).toEqual(85.5);
  });

  it('should save changes to database', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values({
        title: testContentOutline.title,
        target_keyword: testContentOutline.target_keyword,
        secondary_keywords: testContentOutline.secondary_keywords,
        meta_description: testContentOutline.meta_description,
        word_count_target: testContentOutline.word_count_target,
        outline_structure: testContentOutline.outline_structure,
        seo_suggestions: testContentOutline.seo_suggestions,
        content_type: testContentOutline.content_type,
        difficulty_level: testContentOutline.difficulty_level,
        estimated_reading_time: testContentOutline.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = contentOutlineResult[0].id;

    // Create optimization suggestion
    const suggestionResult = await db.insert(optimizationSuggestionsTable)
      .values({
        content_outline_id: contentOutlineId,
        suggestion_type: testSuggestion.suggestion_type,
        priority: testSuggestion.priority,
        suggestion: testSuggestion.suggestion,
        current_value: testSuggestion.current_value,
        recommended_value: testSuggestion.recommended_value,
        impact_score: testSuggestion.impact_score.toString(),
        is_implemented: testSuggestion.is_implemented
      })
      .returning()
      .execute();

    const suggestionId = suggestionResult[0].id;

    // Update suggestion status
    await updateSuggestionStatus(suggestionId, true);

    // Verify changes were saved to database
    const updatedSuggestion = await db.select()
      .from(optimizationSuggestionsTable)
      .where(eq(optimizationSuggestionsTable.id, suggestionId))
      .execute();

    expect(updatedSuggestion).toHaveLength(1);
    expect(updatedSuggestion[0].is_implemented).toEqual(true);
    expect(updatedSuggestion[0].suggestion).toEqual(testSuggestion.suggestion);
    expect(parseFloat(updatedSuggestion[0].impact_score)).toEqual(85.5);
  });

  it('should return null for non-existent suggestion', async () => {
    const nonExistentId = 99999;
    
    const result = await updateSuggestionStatus(nonExistentId, true);

    expect(result).toBeNull();
  });

  it('should handle different suggestion types and priorities', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values({
        title: testContentOutline.title,
        target_keyword: testContentOutline.target_keyword,
        secondary_keywords: testContentOutline.secondary_keywords,
        meta_description: testContentOutline.meta_description,
        word_count_target: testContentOutline.word_count_target,
        outline_structure: testContentOutline.outline_structure,
        seo_suggestions: testContentOutline.seo_suggestions,
        content_type: testContentOutline.content_type,
        difficulty_level: testContentOutline.difficulty_level,
        estimated_reading_time: testContentOutline.estimated_reading_time
      })
      .returning()
      .execute();

    const contentOutlineId = contentOutlineResult[0].id;

    // Create different types of optimization suggestions
    const suggestions = [
      {
        ...testSuggestion,
        content_outline_id: contentOutlineId,
        suggestion_type: 'meta_description' as const,
        priority: 'medium' as const,
        suggestion: 'Optimize meta description length',
        impact_score: 72.3
      },
      {
        ...testSuggestion,
        content_outline_id: contentOutlineId,
        suggestion_type: 'internal_links' as const,
        priority: 'low' as const,
        suggestion: 'Add more internal links',
        impact_score: 45.8
      }
    ];

    const createdSuggestions = [];
    for (const suggestion of suggestions) {
      const result = await db.insert(optimizationSuggestionsTable)
        .values({
          ...suggestion,
          impact_score: suggestion.impact_score.toString()
        })
        .returning()
        .execute();
      createdSuggestions.push(result[0]);
    }

    // Update both suggestions
    const result1 = await updateSuggestionStatus(createdSuggestions[0].id, true);
    const result2 = await updateSuggestionStatus(createdSuggestions[1].id, true);

    // Verify both updates
    expect(result1).not.toBeNull();
    expect(result1!.suggestion_type).toEqual('meta_description');
    expect(result1!.priority).toEqual('medium');
    expect(result1!.is_implemented).toEqual(true);
    expect(result1!.impact_score).toEqual(72.3);

    expect(result2).not.toBeNull();
    expect(result2!.suggestion_type).toEqual('internal_links');
    expect(result2!.priority).toEqual('low');
    expect(result2!.is_implemented).toEqual(true);
    expect(result2!.impact_score).toEqual(45.8);
  });
});