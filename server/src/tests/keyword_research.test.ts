import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type KeywordResearchInput } from '../schema';
import { performKeywordResearch } from '../handlers/keyword_research';
import { eq, gte, lte, and } from 'drizzle-orm';

// Test input with all fields
const testInput: KeywordResearchInput = {
  seed_keyword: 'digital marketing',
  location: 'US',
  language: 'en',
  include_related: true,
  min_search_volume: 500,
  max_difficulty: 80
};

// Minimal test input
const minimalInput: KeywordResearchInput = {
  seed_keyword: 'SEO',
  language: 'en',
  include_related: true,
  min_search_volume: 0,
  max_difficulty: 100
};

describe('performKeywordResearch', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should perform keyword research and return results', async () => {
    const results = await performKeywordResearch(testInput);

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    // Check that seed keyword is included
    const seedKeywordResult = results.find(r => r.keyword === testInput.seed_keyword);
    expect(seedKeywordResult).toBeDefined();
    
    // Verify all results meet the search volume criteria
    results.forEach(result => {
      expect(result.search_volume).toBeGreaterThanOrEqual(testInput.min_search_volume);
      expect(result.difficulty).toBeLessThanOrEqual(testInput.max_difficulty);
      expect(typeof result.difficulty).toBe('number');
      expect(typeof result.cpc).toBe('number');
      expect(['low', 'medium', 'high']).toContain(result.competition);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });
  });

  it('should save keywords to database', async () => {
    const results = await performKeywordResearch(minimalInput);

    // Verify keywords are saved in database
    const savedKeywords = await db.select()
      .from(keywordsTable)
      .execute();

    expect(savedKeywords.length).toBe(results.length);
    
    // Check specific keyword data in database
    const seedKeywordInDB = savedKeywords.find(k => k.keyword === minimalInput.seed_keyword);
    expect(seedKeywordInDB).toBeDefined();
    expect(seedKeywordInDB!.search_volume).toBeGreaterThan(0);
    expect(typeof seedKeywordInDB!.difficulty).toBe('string'); // Stored as string in DB
    expect(typeof seedKeywordInDB!.cpc).toBe('string'); // Stored as string in DB
    expect(seedKeywordInDB!.created_at).toBeInstanceOf(Date);
  });

  it('should handle existing keywords without duplicates', async () => {
    // First research
    const firstResults = await performKeywordResearch(minimalInput);
    const firstCount = firstResults.length;

    // Second research with same input
    const secondResults = await performKeywordResearch(minimalInput);
    
    // Should return same keywords without creating duplicates
    expect(secondResults.length).toBe(firstCount);
    
    // Check database has no duplicates
    const allKeywords = await db.select()
      .from(keywordsTable)
      .execute();
    
    expect(allKeywords.length).toBe(firstCount);
    
    // Verify all returned keywords have proper numeric conversions
    secondResults.forEach(result => {
      expect(typeof result.difficulty).toBe('number');
      expect(typeof result.cpc).toBe('number');
    });
  });

  it('should filter by minimum search volume', async () => {
    const highVolumeInput: KeywordResearchInput = {
      seed_keyword: 'marketing',
      language: 'en',
      include_related: true,
      min_search_volume: 5000,
      max_difficulty: 100
    };

    const results = await performKeywordResearch(highVolumeInput);

    // All results should meet minimum search volume
    results.forEach(result => {
      expect(result.search_volume).toBeGreaterThanOrEqual(5000);
    });

    // Verify database query filtering works
    const lowVolumeKeywords = await db.select()
      .from(keywordsTable)
      .where(lte(keywordsTable.search_volume, 4999))
      .execute();

    expect(lowVolumeKeywords.length).toBe(0);
  });

  it('should filter by maximum difficulty', async () => {
    const easyKeywordsInput: KeywordResearchInput = {
      seed_keyword: 'content writing',
      language: 'en',
      include_related: true,
      min_search_volume: 0,
      max_difficulty: 30
    };

    const results = await performKeywordResearch(easyKeywordsInput);

    // All results should meet maximum difficulty
    results.forEach(result => {
      expect(result.difficulty).toBeLessThanOrEqual(30);
    });

    // Test database filtering with proper numeric conversion
    const savedKeywords = await db.select()
      .from(keywordsTable)
      .execute();

    savedKeywords.forEach(keyword => {
      expect(parseFloat(keyword.difficulty)).toBeLessThanOrEqual(30);
    });
  });

  it('should handle include_related parameter', async () => {
    const withoutRelated: KeywordResearchInput = {
      seed_keyword: 'blogging',
      language: 'en',
      include_related: false,
      min_search_volume: 0,
      max_difficulty: 100
    };

    const withRelated: KeywordResearchInput = {
      ...withoutRelated,
      include_related: true
    };

    const resultsWithoutRelated = await performKeywordResearch(withoutRelated);
    
    // Clear database for second test
    await db.delete(keywordsTable).execute();
    
    const resultsWithRelated = await performKeywordResearch(withRelated);

    // With related keywords should return more results
    expect(resultsWithRelated.length).toBeGreaterThan(resultsWithoutRelated.length);
    
    // Both should include the seed keyword
    expect(resultsWithoutRelated.some(r => r.keyword === 'blogging')).toBe(true);
    expect(resultsWithRelated.some(r => r.keyword === 'blogging')).toBe(true);
  });

  it('should generate realistic trend data', async () => {
    const results = await performKeywordResearch(minimalInput);

    results.forEach(result => {
      if (result.trend_data) {
        expect(() => JSON.parse(result.trend_data!)).not.toThrow();
        
        const trendData = JSON.parse(result.trend_data!);
        expect(trendData).toHaveProperty('months');
        expect(trendData).toHaveProperty('values');
        expect(Array.isArray(trendData.months)).toBe(true);
        expect(Array.isArray(trendData.values)).toBe(true);
      }
    });
  });

  it('should handle complex filter combinations', async () => {
    const complexInput: KeywordResearchInput = {
      seed_keyword: 'artificial intelligence',
      location: 'UK',
      language: 'en',
      include_related: true,
      min_search_volume: 1000,
      max_difficulty: 50
    };

    const results = await performKeywordResearch(complexInput);

    // Apply both filters simultaneously
    const conditions = [
      gte(keywordsTable.search_volume, complexInput.min_search_volume),
      lte(keywordsTable.difficulty, complexInput.max_difficulty.toString())
    ];

    const dbResults = await db.select()
      .from(keywordsTable)
      .where(and(...conditions))
      .execute();

    expect(dbResults.length).toBe(results.length);
    
    // Verify all results meet both criteria
    results.forEach(result => {
      expect(result.search_volume).toBeGreaterThanOrEqual(1000);
      expect(result.difficulty).toBeLessThanOrEqual(50);
    });
  });

  it('should handle edge cases gracefully', async () => {
    // Test with very restrictive filters
    const restrictiveInput: KeywordResearchInput = {
      seed_keyword: 'niche topic',
      language: 'en',
      include_related: true,
      min_search_volume: 50000, // Very high
      max_difficulty: 5 // Very low
    };

    const results = await performKeywordResearch(restrictiveInput);

    // Should handle case where no keywords meet criteria
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(0);
    
    // If results exist, they should meet the strict criteria
    results.forEach(result => {
      expect(result.search_volume).toBeGreaterThanOrEqual(50000);
      expect(result.difficulty).toBeLessThanOrEqual(5);
    });
  });
});