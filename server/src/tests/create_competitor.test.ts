import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type CreateCompetitorInput } from '../schema';
import { createCompetitor } from '../handlers/create_competitor';
import { eq, gte, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCompetitorInput = {
  domain: 'example.com',
  title: 'Best SEO Practices for 2024',
  url: 'https://example.com/seo-practices-2024',
  meta_description: 'Learn the latest SEO practices to dominate search rankings in 2024',
  word_count: 2500,
  domain_authority: 85.5,
  page_authority: 72.3,
  backlinks: 1250,
  ranking_position: 3,
  target_keyword: 'SEO best practices',
  content_quality_score: 94.7
};

// Test input with minimal fields (nullable fields omitted)
const minimalInput: CreateCompetitorInput = {
  domain: 'minimal.com',
  title: 'Simple Guide',
  url: 'https://minimal.com/guide',
  meta_description: null,
  word_count: 800,
  domain_authority: 45.0,
  page_authority: 38.5,
  backlinks: 50,
  ranking_position: 8,
  target_keyword: 'simple guide',
  content_quality_score: 65.2
};

describe('createCompetitor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a competitor with all fields', async () => {
    const result = await createCompetitor(testInput);

    // Basic field validation
    expect(result.domain).toEqual('example.com');
    expect(result.title).toEqual('Best SEO Practices for 2024');
    expect(result.url).toEqual('https://example.com/seo-practices-2024');
    expect(result.meta_description).toEqual('Learn the latest SEO practices to dominate search rankings in 2024');
    expect(result.word_count).toEqual(2500);
    expect(result.domain_authority).toEqual(85.5);
    expect(result.page_authority).toEqual(72.3);
    expect(result.backlinks).toEqual(1250);
    expect(result.ranking_position).toEqual(3);
    expect(result.target_keyword).toEqual('SEO best practices');
    expect(result.content_quality_score).toEqual(94.7);
    expect(result.id).toBeDefined();
    expect(result.analyzed_at).toBeInstanceOf(Date);

    // Verify numeric types are correctly converted
    expect(typeof result.domain_authority).toBe('number');
    expect(typeof result.page_authority).toBe('number');
    expect(typeof result.content_quality_score).toBe('number');
  });

  it('should create a competitor with minimal fields', async () => {
    const result = await createCompetitor(minimalInput);

    expect(result.domain).toEqual('minimal.com');
    expect(result.title).toEqual('Simple Guide');
    expect(result.meta_description).toBeNull();
    expect(result.domain_authority).toEqual(45.0);
    expect(result.page_authority).toEqual(38.5);
    expect(result.content_quality_score).toEqual(65.2);
    expect(result.id).toBeDefined();
    expect(result.analyzed_at).toBeInstanceOf(Date);
  });

  it('should save competitor to database', async () => {
    const result = await createCompetitor(testInput);

    // Query using proper drizzle syntax
    const competitors = await db.select()
      .from(competitorsTable)
      .where(eq(competitorsTable.id, result.id))
      .execute();

    expect(competitors).toHaveLength(1);
    const dbCompetitor = competitors[0];
    expect(dbCompetitor.domain).toEqual('example.com');
    expect(dbCompetitor.title).toEqual('Best SEO Practices for 2024');
    expect(dbCompetitor.url).toEqual('https://example.com/seo-practices-2024');
    expect(parseFloat(dbCompetitor.domain_authority)).toEqual(85.5);
    expect(parseFloat(dbCompetitor.page_authority)).toEqual(72.3);
    expect(parseFloat(dbCompetitor.content_quality_score)).toEqual(94.7);
    expect(dbCompetitor.analyzed_at).toBeInstanceOf(Date);
  });

  it('should handle edge case numeric values correctly', async () => {
    const edgeCaseInput: CreateCompetitorInput = {
      domain: 'edge-case.com',
      title: 'Edge Case Test',
      url: 'https://edge-case.com/test',
      meta_description: null,
      word_count: 1,
      domain_authority: 0.0, // Minimum value
      page_authority: 100.0, // Maximum value
      backlinks: 0,
      ranking_position: 1,
      target_keyword: 'edge case',
      content_quality_score: 50.5 // Decimal value
    };

    const result = await createCompetitor(edgeCaseInput);

    expect(result.domain_authority).toEqual(0.0);
    expect(result.page_authority).toEqual(100.0);
    expect(result.content_quality_score).toEqual(50.5);
    expect(result.word_count).toEqual(1);
    expect(result.backlinks).toEqual(0);
    expect(result.ranking_position).toEqual(1);
  });

  it('should query competitors by target keyword correctly', async () => {
    // Create multiple competitors
    await createCompetitor(testInput);
    await createCompetitor(minimalInput);
    
    const additionalInput: CreateCompetitorInput = {
      ...testInput,
      domain: 'another.com',
      target_keyword: 'SEO best practices' // Same keyword as testInput
    };
    await createCompetitor(additionalInput);

    // Query by target keyword
    const seoCompetitors = await db.select()
      .from(competitorsTable)
      .where(eq(competitorsTable.target_keyword, 'SEO best practices'))
      .execute();

    expect(seoCompetitors).toHaveLength(2);
    seoCompetitors.forEach(competitor => {
      expect(competitor.target_keyword).toEqual('SEO best practices');
      expect(competitor.analyzed_at).toBeInstanceOf(Date);
    });
  });

  it('should query competitors by date range correctly', async () => {
    // Create test competitor
    await createCompetitor(testInput);

    // Test date filtering - use a time before creation
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Proper query building
    const competitors = await db.select()
      .from(competitorsTable)
      .where(gte(competitorsTable.analyzed_at, oneHourAgo))
      .execute();

    expect(competitors.length).toBeGreaterThan(0);
    competitors.forEach(competitor => {
      expect(competitor.analyzed_at).toBeInstanceOf(Date);
      expect(competitor.analyzed_at >= oneHourAgo).toBe(true);
    });
  });

  it('should handle decimal values correctly', async () => {
    const precisionInput: CreateCompetitorInput = {
      domain: 'precision.com',
      title: 'Precision Test',
      url: 'https://precision.com/test',
      meta_description: 'Testing decimal precision',
      word_count: 1500,
      domain_authority: 67.89, // Two decimal places
      page_authority: 54.32, // Two decimal places
      backlinks: 750,
      ranking_position: 5,
      target_keyword: 'precision test',
      content_quality_score: 78.45 // Two decimal places
    };

    const result = await createCompetitor(precisionInput);

    // Verify decimal values are preserved (PostgreSQL numeric with precision 5, scale 2)
    expect(result.domain_authority).toEqual(67.89);
    expect(result.page_authority).toEqual(54.32);
    expect(result.content_quality_score).toEqual(78.45);
    
    // Verify database storage and retrieval
    const dbRecord = await db.select()
      .from(competitorsTable)
      .where(eq(competitorsTable.id, result.id))
      .execute();

    expect(parseFloat(dbRecord[0].domain_authority)).toEqual(67.89);
    expect(parseFloat(dbRecord[0].page_authority)).toEqual(54.32);
    expect(parseFloat(dbRecord[0].content_quality_score)).toEqual(78.45);
  });
});