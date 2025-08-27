import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type CompetitorAnalysisInput } from '../schema';
import { performCompetitorAnalysis } from '../handlers/competitor_analysis';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CompetitorAnalysisInput = {
  target_keyword: 'content marketing',
  location: 'US',
  limit: 5
};

describe('performCompetitorAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate mock competitor data when no existing data exists', async () => {
    const result = await performCompetitorAnalysis(testInput);

    expect(result).toHaveLength(5);
    
    // Validate first competitor structure
    const firstCompetitor = result[0];
    expect(firstCompetitor.id).toBeGreaterThan(0);
    expect(firstCompetitor.domain).toBeDefined();
    expect(firstCompetitor.title).toContain('content marketing');
    expect(firstCompetitor.url).toMatch(/^https:\/\//);
    expect(firstCompetitor.meta_description).toBeDefined();
    expect(firstCompetitor.word_count).toBeGreaterThan(1000);
    expect(firstCompetitor.domain_authority).toBeGreaterThanOrEqual(10);
    expect(firstCompetitor.domain_authority).toBeLessThanOrEqual(100);
    expect(firstCompetitor.page_authority).toBeGreaterThanOrEqual(5);
    expect(firstCompetitor.page_authority).toBeLessThanOrEqual(100);
    expect(firstCompetitor.backlinks).toBeGreaterThanOrEqual(0);
    expect(firstCompetitor.ranking_position).toBe(1);
    expect(firstCompetitor.target_keyword).toBe('content marketing');
    expect(firstCompetitor.content_quality_score).toBeGreaterThanOrEqual(40);
    expect(firstCompetitor.content_quality_score).toBeLessThanOrEqual(100);
    expect(firstCompetitor.analyzed_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof firstCompetitor.domain_authority).toBe('number');
    expect(typeof firstCompetitor.page_authority).toBe('number');
    expect(typeof firstCompetitor.content_quality_score).toBe('number');
  });

  it('should respect the limit parameter', async () => {
    const limitedInput: CompetitorAnalysisInput = {
      target_keyword: 'seo optimization',
      limit: 3
    };

    const result = await performCompetitorAnalysis(limitedInput);
    expect(result).toHaveLength(3);
  });

  it('should rank competitors by position correctly', async () => {
    const result = await performCompetitorAnalysis(testInput);

    // Verify ranking positions are in ascending order
    for (let i = 0; i < result.length; i++) {
      expect(result[i].ranking_position).toBe(i + 1);
    }

    // Generally, higher ranking positions should have lower authority (with some variance)
    const averageDA = result.reduce((sum, comp) => sum + comp.domain_authority, 0) / result.length;
    expect(result[0].domain_authority).toBeGreaterThanOrEqual(averageDA - 20); // Top result should be relatively high
  });

  it('should save generated competitors to database', async () => {
    await performCompetitorAnalysis(testInput);

    // Query database directly to verify data was saved
    const competitors = await db.select()
      .from(competitorsTable)
      .where(eq(competitorsTable.target_keyword, 'content marketing'))
      .execute();

    expect(competitors).toHaveLength(5);
    expect(competitors[0].target_keyword).toBe('content marketing');
    expect(parseFloat(competitors[0].domain_authority)).toBeGreaterThanOrEqual(10);
    expect(competitors[0].analyzed_at).toBeInstanceOf(Date);
  });

  it('should return existing data when available', async () => {
    // First, insert some existing competitor data
    const existingCompetitor = {
      domain: 'existing-site.com',
      title: 'Existing Content Marketing Guide',
      url: 'https://existing-site.com/content-marketing',
      meta_description: 'An existing guide about content marketing',
      word_count: 2500,
      domain_authority: '85',
      page_authority: '78',
      backlinks: 450,
      ranking_position: 1,
      target_keyword: 'content marketing',
      content_quality_score: '92'
    };

    await db.insert(competitorsTable)
      .values([existingCompetitor])
      .execute();

    // Now perform competitor analysis
    const result = await performCompetitorAnalysis(testInput);

    // Should return the existing data, not generate new mock data
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('existing-site.com');
    expect(result[0].title).toBe('Existing Content Marketing Guide');
    expect(result[0].domain_authority).toBe(85); // Should be converted to number
    expect(result[0].page_authority).toBe(78);
    expect(result[0].content_quality_score).toBe(92);
    
    // Verify numeric conversions
    expect(typeof result[0].domain_authority).toBe('number');
    expect(typeof result[0].page_authority).toBe('number');
    expect(typeof result[0].content_quality_score).toBe('number');
  });

  it('should filter by target keyword correctly', async () => {
    // Insert competitors for different keywords
    const competitors = [
      {
        domain: 'site1.com',
        title: 'Content Marketing Guide',
        url: 'https://site1.com/content-marketing',
        meta_description: 'Guide about content marketing',
        word_count: 2000,
        domain_authority: '80',
        page_authority: '75',
        backlinks: 300,
        ranking_position: 1,
        target_keyword: 'content marketing',
        content_quality_score: '85'
      },
      {
        domain: 'site2.com',
        title: 'SEO Guide',
        url: 'https://site2.com/seo',
        meta_description: 'Guide about SEO',
        word_count: 1800,
        domain_authority: '75',
        page_authority: '70',
        backlinks: 250,
        ranking_position: 1,
        target_keyword: 'SEO optimization',
        content_quality_score: '80'
      }
    ];

    await db.insert(competitorsTable)
      .values(competitors)
      .execute();

    // Search for content marketing competitors only
    const result = await performCompetitorAnalysis(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].target_keyword).toBe('content marketing');
    expect(result[0].domain).toBe('site1.com');
  });

  it('should handle edge case with limit larger than available domains', async () => {
    const largeInput: CompetitorAnalysisInput = {
      target_keyword: 'edge case keyword',
      limit: 50 // Larger than available mock domains
    };

    const result = await performCompetitorAnalysis(largeInput);
    
    // Should not exceed the number of available mock domains
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate realistic competitor metrics', async () => {
    const result = await performCompetitorAnalysis(testInput);

    result.forEach((competitor, index) => {
      // Verify all required fields are present and valid
      expect(competitor.domain).toBeTruthy();
      expect(competitor.title).toContain(testInput.target_keyword);
      expect(competitor.url).toMatch(/^https:\/\//);
      expect(competitor.word_count).toBeGreaterThan(1000);
      expect(competitor.word_count).toBeLessThan(4000);
      expect(competitor.backlinks).toBeGreaterThanOrEqual(0);
      expect(competitor.ranking_position).toBe(index + 1);
      
      // Verify score ranges
      expect(competitor.domain_authority).toBeGreaterThanOrEqual(10);
      expect(competitor.domain_authority).toBeLessThanOrEqual(100);
      expect(competitor.page_authority).toBeGreaterThanOrEqual(5);
      expect(competitor.page_authority).toBeLessThanOrEqual(100);
      expect(competitor.content_quality_score).toBeGreaterThanOrEqual(40);
      expect(competitor.content_quality_score).toBeLessThanOrEqual(100);
    });
  });

  it('should handle empty keyword gracefully', async () => {
    const emptyKeywordInput: CompetitorAnalysisInput = {
      target_keyword: '',
      limit: 3
    };

    const result = await performCompetitorAnalysis(emptyKeywordInput);
    
    // Should still generate results but with empty target_keyword
    expect(result).toHaveLength(3);
    result.forEach(competitor => {
      expect(competitor.target_keyword).toBe('');
    });
  });
});