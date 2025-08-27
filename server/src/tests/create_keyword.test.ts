import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type CreateKeywordInput } from '../schema';
import { createKeyword } from '../handlers/create_keyword';
import { eq, gte, between, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateKeywordInput = {
  keyword: 'best coffee makers',
  search_volume: 12000,
  difficulty: 65.5,
  cpc: 2.35,
  competition: 'medium',
  trend_data: '{"Jan": 8500, "Feb": 9200, "Mar": 11500}'
};

describe('createKeyword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a keyword', async () => {
    const result = await createKeyword(testInput);

    // Basic field validation
    expect(result.keyword).toEqual('best coffee makers');
    expect(result.search_volume).toEqual(12000);
    expect(result.difficulty).toEqual(65.5);
    expect(result.cpc).toEqual(2.35);
    expect(result.competition).toEqual('medium');
    expect(result.trend_data).toEqual('{"Jan": 8500, "Feb": 9200, "Mar": 11500}');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify numeric types are properly converted
    expect(typeof result.difficulty).toBe('number');
    expect(typeof result.cpc).toBe('number');
  });

  it('should save keyword to database', async () => {
    const result = await createKeyword(testInput);

    // Query using proper drizzle syntax
    const keywords = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.id, result.id))
      .execute();

    expect(keywords).toHaveLength(1);
    expect(keywords[0].keyword).toEqual('best coffee makers');
    expect(keywords[0].search_volume).toEqual(12000);
    expect(parseFloat(keywords[0].difficulty)).toEqual(65.5);
    expect(parseFloat(keywords[0].cpc)).toEqual(2.35);
    expect(keywords[0].competition).toEqual('medium');
    expect(keywords[0].trend_data).toEqual('{"Jan": 8500, "Feb": 9200, "Mar": 11500}');
    expect(keywords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null trend_data', async () => {
    const inputWithNullTrend: CreateKeywordInput = {
      ...testInput,
      trend_data: null
    };

    const result = await createKeyword(inputWithNullTrend);

    expect(result.trend_data).toBeNull();
    expect(result.keyword).toEqual('best coffee makers');
    expect(result.search_volume).toEqual(12000);
  });

  it('should handle different competition levels', async () => {
    const lowCompetitionInput: CreateKeywordInput = {
      ...testInput,
      keyword: 'low competition keyword',
      competition: 'low'
    };

    const highCompetitionInput: CreateKeywordInput = {
      ...testInput,
      keyword: 'high competition keyword',
      competition: 'high'
    };

    const lowResult = await createKeyword(lowCompetitionInput);
    const highResult = await createKeyword(highCompetitionInput);

    expect(lowResult.competition).toEqual('low');
    expect(highResult.competition).toEqual('high');
  });

  it('should handle edge case numeric values', async () => {
    const edgeInput: CreateKeywordInput = {
      keyword: 'edge case keyword',
      search_volume: 0,
      difficulty: 0,
      cpc: 0,
      competition: 'low',
      trend_data: null
    };

    const result = await createKeyword(edgeInput);

    expect(result.search_volume).toEqual(0);
    expect(result.difficulty).toEqual(0);
    expect(result.cpc).toEqual(0);
    expect(typeof result.difficulty).toBe('number');
    expect(typeof result.cpc).toBe('number');
  });

  it('should handle maximum numeric values', async () => {
    const maxInput: CreateKeywordInput = {
      keyword: 'max values keyword',
      search_volume: 999999,
      difficulty: 100,
      cpc: 999.99,
      competition: 'high',
      trend_data: '{"data": "max_trend_data"}'
    };

    const result = await createKeyword(maxInput);

    expect(result.search_volume).toEqual(999999);
    expect(result.difficulty).toEqual(100);
    expect(result.cpc).toEqual(999.99);
    expect(result.competition).toEqual('high');
  });

  it('should query keywords by date range correctly', async () => {
    // Create test keyword
    await createKeyword(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - step by step
    const keywords = await db.select()
      .from(keywordsTable)
      .where(
        and(
          gte(keywordsTable.created_at, yesterday),
          between(keywordsTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(keywords.length).toBeGreaterThan(0);
    keywords.forEach(keyword => {
      expect(keyword.created_at).toBeInstanceOf(Date);
      expect(keyword.created_at >= yesterday).toBe(true);
      expect(keyword.created_at <= tomorrow).toBe(true);
    });
  });

  it('should create multiple keywords with unique data', async () => {
    const input1: CreateKeywordInput = {
      keyword: 'keyword one',
      search_volume: 5000,
      difficulty: 25.0,
      cpc: 1.50,
      competition: 'low',
      trend_data: null
    };

    const input2: CreateKeywordInput = {
      keyword: 'keyword two',
      search_volume: 15000,
      difficulty: 75.0,
      cpc: 5.25,
      competition: 'high',
      trend_data: '{"trend": "upward"}'
    };

    const result1 = await createKeyword(input1);
    const result2 = await createKeyword(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.keyword).toEqual('keyword one');
    expect(result2.keyword).toEqual('keyword two');
    expect(result1.difficulty).toEqual(25.0);
    expect(result2.difficulty).toEqual(75.0);
  });
});