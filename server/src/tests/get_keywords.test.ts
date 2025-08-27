import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type CreateKeywordInput } from '../schema';
import { getKeywords } from '../handlers/get_keywords';

// Test data
const testKeyword1: CreateKeywordInput = {
  keyword: 'seo optimization',
  search_volume: 5000,
  difficulty: 65.5,
  cpc: 2.75,
  competition: 'high',
  trend_data: '{"trend": "increasing"}'
};

const testKeyword2: CreateKeywordInput = {
  keyword: 'content marketing',
  search_volume: 8200,
  difficulty: 45.2,
  cpc: 1.85,
  competition: 'medium',
  trend_data: null
};

const testKeyword3: CreateKeywordInput = {
  keyword: 'keyword research',
  search_volume: 12000,
  difficulty: 72.8,
  cpc: 3.25,
  competition: 'high',
  trend_data: '{"trend": "stable", "months": [100, 95, 98]}'
};

describe('getKeywords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no keywords exist', async () => {
    const result = await getKeywords();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all keywords from database', async () => {
    // Insert test data
    await db.insert(keywordsTable)
      .values([
        {
          ...testKeyword1,
          difficulty: testKeyword1.difficulty.toString(),
          cpc: testKeyword1.cpc.toString()
        },
        {
          ...testKeyword2,
          difficulty: testKeyword2.difficulty.toString(),
          cpc: testKeyword2.cpc.toString()
        }
      ])
      .execute();

    const result = await getKeywords();

    expect(result).toHaveLength(2);
    expect(result[0].keyword).toBeDefined();
    expect(result[0].search_volume).toBeDefined();
    expect(result[0].difficulty).toBeDefined();
    expect(result[0].cpc).toBeDefined();
    expect(result[0].competition).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return keywords with correct numeric conversions', async () => {
    // Insert test data with numeric fields
    await db.insert(keywordsTable)
      .values({
        ...testKeyword1,
        difficulty: testKeyword1.difficulty.toString(),
        cpc: testKeyword1.cpc.toString()
      })
      .execute();

    const result = await getKeywords();

    expect(result).toHaveLength(1);
    const keyword = result[0];
    
    // Verify numeric fields are properly converted
    expect(typeof keyword.difficulty).toBe('number');
    expect(keyword.difficulty).toBe(65.5);
    expect(typeof keyword.cpc).toBe('number');
    expect(keyword.cpc).toBe(2.75);
    
    // Verify other fields maintain correct types
    expect(typeof keyword.search_volume).toBe('number');
    expect(keyword.search_volume).toBe(5000);
    expect(keyword.keyword).toBe('seo optimization');
    expect(keyword.competition).toBe('high');
    expect(keyword.trend_data).toBe('{"trend": "increasing"}');
  });

  it('should return keywords ordered by creation date (newest first)', async () => {
    // Insert keywords with slight delay to ensure different timestamps
    await db.insert(keywordsTable)
      .values({
        ...testKeyword1,
        difficulty: testKeyword1.difficulty.toString(),
        cpc: testKeyword1.cpc.toString()
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(keywordsTable)
      .values({
        ...testKeyword2,
        difficulty: testKeyword2.difficulty.toString(),
        cpc: testKeyword2.cpc.toString()
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(keywordsTable)
      .values({
        ...testKeyword3,
        difficulty: testKeyword3.difficulty.toString(),
        cpc: testKeyword3.cpc.toString()
      })
      .execute();

    const result = await getKeywords();

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at descending (newest first)
    expect(result[0].keyword).toBe('keyword research');
    expect(result[1].keyword).toBe('content marketing');
    expect(result[2].keyword).toBe('seo optimization');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle keywords with null trend_data', async () => {
    await db.insert(keywordsTable)
      .values({
        ...testKeyword2,
        difficulty: testKeyword2.difficulty.toString(),
        cpc: testKeyword2.cpc.toString()
      })
      .execute();

    const result = await getKeywords();

    expect(result).toHaveLength(1);
    expect(result[0].trend_data).toBeNull();
    expect(result[0].keyword).toBe('content marketing');
  });

  it('should handle different competition levels correctly', async () => {
    const lowCompetition: CreateKeywordInput = {
      keyword: 'niche keyword',
      search_volume: 100,
      difficulty: 15.0,
      cpc: 0.50,
      competition: 'low',
      trend_data: null
    };

    await db.insert(keywordsTable)
      .values([
        {
          ...testKeyword1, // high competition
          difficulty: testKeyword1.difficulty.toString(),
          cpc: testKeyword1.cpc.toString()
        },
        {
          ...testKeyword2, // medium competition
          difficulty: testKeyword2.difficulty.toString(),
          cpc: testKeyword2.cpc.toString()
        },
        {
          ...lowCompetition, // low competition
          difficulty: lowCompetition.difficulty.toString(),
          cpc: lowCompetition.cpc.toString()
        }
      ])
      .execute();

    const result = await getKeywords();

    expect(result).toHaveLength(3);
    
    const competitions = result.map(k => k.competition).sort();
    expect(competitions).toEqual(['high', 'low', 'medium']);
  });
});