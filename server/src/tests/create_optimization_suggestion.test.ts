import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { optimizationSuggestionsTable, contentOutlinesTable } from '../db/schema';
import { type CreateOptimizationSuggestionInput } from '../schema';
import { createOptimizationSuggestion } from '../handlers/create_optimization_suggestion';
import { eq } from 'drizzle-orm';

// Test content outline for prerequisite data
const testContentOutline = {
  title: 'SEO Content Guide',
  target_keyword: 'seo optimization',
  secondary_keywords: '["content marketing", "search engine optimization"]',
  meta_description: 'Complete guide to SEO content optimization',
  word_count_target: 2000,
  outline_structure: '{"h1": "SEO Guide", "h2": ["Introduction", "Best Practices"]}',
  seo_suggestions: '["Use target keyword in title", "Add internal links"]',
  content_type: 'guide' as const,
  difficulty_level: 'intermediate' as const,
  estimated_reading_time: 10
};

// Test optimization suggestion input
const testInput: CreateOptimizationSuggestionInput = {
  content_outline_id: 1, // Will be set after creating content outline
  suggestion_type: 'title',
  priority: 'high',
  suggestion: 'Include target keyword at the beginning of the title',
  current_value: 'Guide to Content Creation',
  recommended_value: 'SEO Optimization: Complete Guide to Content Creation',
  impact_score: 85.5,
  is_implemented: false
};

describe('createOptimizationSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an optimization suggestion', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const inputWithValidId = {
      ...testInput,
      content_outline_id: contentOutlineResult[0].id
    };

    const result = await createOptimizationSuggestion(inputWithValidId);

    // Basic field validation
    expect(result.content_outline_id).toEqual(contentOutlineResult[0].id);
    expect(result.suggestion_type).toEqual('title');
    expect(result.priority).toEqual('high');
    expect(result.suggestion).toEqual('Include target keyword at the beginning of the title');
    expect(result.current_value).toEqual('Guide to Content Creation');
    expect(result.recommended_value).toEqual('SEO Optimization: Complete Guide to Content Creation');
    expect(result.impact_score).toEqual(85.5);
    expect(typeof result.impact_score).toEqual('number'); // Verify numeric conversion
    expect(result.is_implemented).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save optimization suggestion to database', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const inputWithValidId = {
      ...testInput,
      content_outline_id: contentOutlineResult[0].id
    };

    const result = await createOptimizationSuggestion(inputWithValidId);

    // Query from database to verify persistence
    const suggestions = await db.select()
      .from(optimizationSuggestionsTable)
      .where(eq(optimizationSuggestionsTable.id, result.id))
      .execute();

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestion_type).toEqual('title');
    expect(suggestions[0].priority).toEqual('high');
    expect(suggestions[0].suggestion).toEqual('Include target keyword at the beginning of the title');
    expect(parseFloat(suggestions[0].impact_score)).toEqual(85.5);
    expect(suggestions[0].is_implemented).toEqual(false);
    expect(suggestions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const inputWithNulls: CreateOptimizationSuggestionInput = {
      content_outline_id: contentOutlineResult[0].id,
      suggestion_type: 'readability',
      priority: 'medium',
      suggestion: 'Improve sentence structure for better readability',
      current_value: null, // Test null value
      recommended_value: null, // Test null value
      impact_score: 60.0,
      is_implemented: true
    };

    const result = await createOptimizationSuggestion(inputWithNulls);

    expect(result.current_value).toBeNull();
    expect(result.recommended_value).toBeNull();
    expect(result.suggestion_type).toEqual('readability');
    expect(result.priority).toEqual('medium');
    expect(result.is_implemented).toEqual(true);
    expect(result.impact_score).toEqual(60.0);
  });

  it('should handle all suggestion types', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const suggestionTypes = ['title', 'meta_description', 'headings', 'internal_links', 'images', 'keyword_density', 'readability'] as const;

    for (const suggestionType of suggestionTypes) {
      const input: CreateOptimizationSuggestionInput = {
        content_outline_id: contentOutlineResult[0].id,
        suggestion_type: suggestionType,
        priority: 'low',
        suggestion: `Optimize ${suggestionType} for better SEO`,
        current_value: 'Current state',
        recommended_value: 'Recommended state',
        impact_score: 50.0,
        is_implemented: false
      };

      const result = await createOptimizationSuggestion(input);
      expect(result.suggestion_type).toEqual(suggestionType);
      expect(result.suggestion).toEqual(`Optimize ${suggestionType} for better SEO`);
    }
  });

  it('should handle all priority levels', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const priorities = ['high', 'medium', 'low'] as const;

    for (const priority of priorities) {
      const input: CreateOptimizationSuggestionInput = {
        content_outline_id: contentOutlineResult[0].id,
        suggestion_type: 'title',
        priority: priority,
        suggestion: `${priority} priority suggestion`,
        current_value: 'Current',
        recommended_value: 'Recommended',
        impact_score: 70.5,
        is_implemented: false
      };

      const result = await createOptimizationSuggestion(input);
      expect(result.priority).toEqual(priority);
      expect(result.suggestion).toEqual(`${priority} priority suggestion`);
    }
  });

  it('should throw error for non-existent content outline', async () => {
    const invalidInput = {
      ...testInput,
      content_outline_id: 999 // Non-existent ID
    };

    await expect(createOptimizationSuggestion(invalidInput))
      .rejects.toThrow(/Content outline with id 999 not found/i);
  });

  it('should handle decimal impact scores correctly', async () => {
    // Create prerequisite content outline
    const contentOutlineResult = await db.insert(contentOutlinesTable)
      .values(testContentOutline)
      .returning()
      .execute();

    const inputWithDecimal: CreateOptimizationSuggestionInput = {
      content_outline_id: contentOutlineResult[0].id,
      suggestion_type: 'keyword_density',
      priority: 'high',
      suggestion: 'Adjust keyword density to optimal range',
      current_value: '0.5%',
      recommended_value: '1.2%',
      impact_score: 92.75, // Decimal value
      is_implemented: false
    };

    const result = await createOptimizationSuggestion(inputWithDecimal);

    expect(result.impact_score).toEqual(92.75);
    expect(typeof result.impact_score).toEqual('number');

    // Verify in database
    const dbRecord = await db.select()
      .from(optimizationSuggestionsTable)
      .where(eq(optimizationSuggestionsTable.id, result.id))
      .execute();

    expect(parseFloat(dbRecord[0].impact_score)).toEqual(92.75);
  });
});