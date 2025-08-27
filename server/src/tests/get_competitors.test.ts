import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type CreateCompetitorInput } from '../schema';
import { getCompetitors } from '../handlers/get_competitors';

// Test competitor data
const testCompetitor1: CreateCompetitorInput = {
  domain: 'example.com',
  title: 'Best SEO Guide 2024',
  url: 'https://example.com/seo-guide',
  meta_description: 'Comprehensive SEO guide for beginners',
  word_count: 2500,
  domain_authority: 85.5,
  page_authority: 72.3,
  backlinks: 1250,
  ranking_position: 1,
  target_keyword: 'seo guide',
  content_quality_score: 92.8
};

const testCompetitor2: CreateCompetitorInput = {
  domain: 'competitor2.com',
  title: 'Advanced SEO Techniques',
  url: 'https://competitor2.com/advanced-seo',
  meta_description: null,
  word_count: 3200,
  domain_authority: 78.2,
  page_authority: 68.9,
  backlinks: 890,
  ranking_position: 2,
  target_keyword: 'seo guide',
  content_quality_score: 88.5
};

const testCompetitor3: CreateCompetitorInput = {
  domain: 'smallsite.org',
  title: 'SEO Basics',
  url: 'https://smallsite.org/seo-basics',
  meta_description: 'Learn SEO fundamentals',
  word_count: 1200,
  domain_authority: 45.0,
  page_authority: 35.5,
  backlinks: 125,
  ranking_position: 8,
  target_keyword: 'seo basics',
  content_quality_score: 65.2
};

describe('getCompetitors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no competitors exist', async () => {
    const result = await getCompetitors();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch single competitor correctly', async () => {
    // Insert test competitor
    await db.insert(competitorsTable)
      .values({
        domain: testCompetitor1.domain,
        title: testCompetitor1.title,
        url: testCompetitor1.url,
        meta_description: testCompetitor1.meta_description,
        word_count: testCompetitor1.word_count,
        domain_authority: testCompetitor1.domain_authority.toString(),
        page_authority: testCompetitor1.page_authority.toString(),
        backlinks: testCompetitor1.backlinks,
        ranking_position: testCompetitor1.ranking_position,
        target_keyword: testCompetitor1.target_keyword,
        content_quality_score: testCompetitor1.content_quality_score.toString()
      })
      .execute();

    const result = await getCompetitors();

    expect(result).toHaveLength(1);
    expect(result[0].domain).toEqual('example.com');
    expect(result[0].title).toEqual('Best SEO Guide 2024');
    expect(result[0].url).toEqual('https://example.com/seo-guide');
    expect(result[0].meta_description).toEqual('Comprehensive SEO guide for beginners');
    expect(result[0].word_count).toEqual(2500);
    expect(result[0].domain_authority).toEqual(85.5);
    expect(result[0].page_authority).toEqual(72.3);
    expect(result[0].backlinks).toEqual(1250);
    expect(result[0].ranking_position).toEqual(1);
    expect(result[0].target_keyword).toEqual('seo guide');
    expect(result[0].content_quality_score).toEqual(92.8);
    expect(result[0].id).toBeDefined();
    expect(result[0].analyzed_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple competitors ordered by analyzed_at descending', async () => {
    // Insert first competitor
    await db.insert(competitorsTable)
      .values({
        domain: testCompetitor1.domain,
        title: testCompetitor1.title,
        url: testCompetitor1.url,
        meta_description: testCompetitor1.meta_description,
        word_count: testCompetitor1.word_count,
        domain_authority: testCompetitor1.domain_authority.toString(),
        page_authority: testCompetitor1.page_authority.toString(),
        backlinks: testCompetitor1.backlinks,
        ranking_position: testCompetitor1.ranking_position,
        target_keyword: testCompetitor1.target_keyword,
        content_quality_score: testCompetitor1.content_quality_score.toString()
      })
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second competitor (will have later timestamp)
    await db.insert(competitorsTable)
      .values({
        domain: testCompetitor2.domain,
        title: testCompetitor2.title,
        url: testCompetitor2.url,
        meta_description: testCompetitor2.meta_description,
        word_count: testCompetitor2.word_count,
        domain_authority: testCompetitor2.domain_authority.toString(),
        page_authority: testCompetitor2.page_authority.toString(),
        backlinks: testCompetitor2.backlinks,
        ranking_position: testCompetitor2.ranking_position,
        target_keyword: testCompetitor2.target_keyword,
        content_quality_score: testCompetitor2.content_quality_score.toString()
      })
      .execute();

    const result = await getCompetitors();

    expect(result).toHaveLength(2);
    // Most recent should be first (testCompetitor2)
    expect(result[0].domain).toEqual('competitor2.com');
    expect(result[1].domain).toEqual('example.com');
    
    // Verify ordering by timestamp
    expect(result[0].analyzed_at >= result[1].analyzed_at).toBe(true);
  });

  it('should handle null values correctly', async () => {
    // Insert competitor with null meta_description
    await db.insert(competitorsTable)
      .values({
        domain: testCompetitor2.domain,
        title: testCompetitor2.title,
        url: testCompetitor2.url,
        meta_description: testCompetitor2.meta_description, // null
        word_count: testCompetitor2.word_count,
        domain_authority: testCompetitor2.domain_authority.toString(),
        page_authority: testCompetitor2.page_authority.toString(),
        backlinks: testCompetitor2.backlinks,
        ranking_position: testCompetitor2.ranking_position,
        target_keyword: testCompetitor2.target_keyword,
        content_quality_score: testCompetitor2.content_quality_score.toString()
      })
      .execute();

    const result = await getCompetitors();

    expect(result).toHaveLength(1);
    expect(result[0].meta_description).toBeNull();
    expect(result[0].domain).toEqual('competitor2.com');
  });

  it('should convert numeric fields to numbers correctly', async () => {
    await db.insert(competitorsTable)
      .values({
        domain: testCompetitor3.domain,
        title: testCompetitor3.title,
        url: testCompetitor3.url,
        meta_description: testCompetitor3.meta_description,
        word_count: testCompetitor3.word_count,
        domain_authority: testCompetitor3.domain_authority.toString(),
        page_authority: testCompetitor3.page_authority.toString(),
        backlinks: testCompetitor3.backlinks,
        ranking_position: testCompetitor3.ranking_position,
        target_keyword: testCompetitor3.target_keyword,
        content_quality_score: testCompetitor3.content_quality_score.toString()
      })
      .execute();

    const result = await getCompetitors();

    expect(result).toHaveLength(1);
    // Verify all numeric fields are actually numbers
    expect(typeof result[0].domain_authority).toBe('number');
    expect(typeof result[0].page_authority).toBe('number');
    expect(typeof result[0].content_quality_score).toBe('number');
    expect(result[0].domain_authority).toEqual(45.0);
    expect(result[0].page_authority).toEqual(35.5);
    expect(result[0].content_quality_score).toEqual(65.2);
  });

  it('should handle large dataset correctly', async () => {
    // Insert multiple competitors with different data
    const competitors = [];
    for (let i = 1; i <= 5; i++) {
      competitors.push({
        domain: `competitor${i}.com`,
        title: `SEO Article ${i}`,
        url: `https://competitor${i}.com/article`,
        meta_description: `Meta description ${i}`,
        word_count: 1000 + (i * 500),
        domain_authority: (50 + i * 5).toString(),
        page_authority: (40 + i * 3).toString(),
        backlinks: 100 * i,
        ranking_position: i,
        target_keyword: 'seo tips',
        content_quality_score: (60 + i * 5).toString()
      });
    }

    await db.insert(competitorsTable)
      .values(competitors)
      .execute();

    const result = await getCompetitors();

    expect(result).toHaveLength(5);
    // Verify all have proper structure
    result.forEach(competitor => {
      expect(competitor.id).toBeDefined();
      expect(competitor.domain).toMatch(/competitor\d+\.com/);
      expect(competitor.analyzed_at).toBeInstanceOf(Date);
      expect(typeof competitor.domain_authority).toBe('number');
      expect(typeof competitor.page_authority).toBe('number');
      expect(typeof competitor.content_quality_score).toBe('number');
    });
  });
});