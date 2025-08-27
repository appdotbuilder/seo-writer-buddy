import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type KeywordResearchInput, type Keyword } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function performKeywordResearch(input: KeywordResearchInput): Promise<Keyword[]> {
  try {
    // Generate keyword variations based on seed keyword
    const keywordVariations = generateKeywordVariations(input.seed_keyword, input.include_related);
    
    // Filter by existing criteria and simulate API data fetching
    const keywordData = keywordVariations
      .map(keyword => generateKeywordData(keyword, input.seed_keyword))
      .filter(data => 
        data.search_volume >= input.min_search_volume && 
        data.difficulty <= input.max_difficulty
      );

    // Insert new keywords into database
    const insertedKeywords = [];
    
    for (const data of keywordData) {
      // Check if keyword already exists
      const existing = await db.select()
        .from(keywordsTable)
        .where(eq(keywordsTable.keyword, data.keyword))
        .execute();

      if (existing.length === 0) {
        // Insert new keyword
        const result = await db.insert(keywordsTable)
          .values({
            keyword: data.keyword,
            search_volume: data.search_volume,
            difficulty: data.difficulty.toString(),
            cpc: data.cpc.toString(),
            competition: data.competition,
            trend_data: data.trend_data
          })
          .returning()
          .execute();

        const insertedKeyword = result[0];
        insertedKeywords.push({
          ...insertedKeyword,
          difficulty: parseFloat(insertedKeyword.difficulty),
          cpc: parseFloat(insertedKeyword.cpc)
        });
      } else {
        // Return existing keyword with proper numeric conversion
        const existingKeyword = existing[0];
        insertedKeywords.push({
          ...existingKeyword,
          difficulty: parseFloat(existingKeyword.difficulty),
          cpc: parseFloat(existingKeyword.cpc)
        });
      }
    }

    return insertedKeywords;
  } catch (error) {
    console.error('Keyword research failed:', error);
    throw error;
  }
}

// Helper function to generate keyword variations
function generateKeywordVariations(seedKeyword: string, includeRelated: boolean): string[] {
  const variations = [seedKeyword];
  
  if (includeRelated) {
    const baseVariations = [
      `${seedKeyword} guide`,
      `${seedKeyword} tips`,
      `best ${seedKeyword}`,
      `how to ${seedKeyword}`,
      `${seedKeyword} tutorial`,
      `${seedKeyword} review`,
      `${seedKeyword} comparison`,
      `top ${seedKeyword}`,
      `${seedKeyword} benefits`,
      `${seedKeyword} cost`
    ];
    
    variations.push(...baseVariations);
    
    // Add some word variations
    const words = seedKeyword.split(' ');
    if (words.length > 1) {
      variations.push(words.reverse().join(' ')); // Reverse word order
      variations.push(words.slice(0, -1).join(' ')); // Remove last word
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

// Helper function to generate realistic keyword data
function generateKeywordData(keyword: string, seedKeyword: string) {
  // Simulate realistic search volumes based on keyword length and type
  const baseVolume = keyword === seedKeyword ? 10000 : Math.floor(Math.random() * 8000) + 1000;
  const search_volume = Math.floor(baseVolume * (0.5 + Math.random() * 0.5));
  
  // Generate difficulty score (longer keywords tend to be easier)
  const baseDifficulty = keyword.length > seedKeyword.length ? 30 : 60;
  const difficulty = Math.min(100, Math.max(5, baseDifficulty + (Math.random() - 0.5) * 40));
  
  // Generate CPC based on commercial intent
  const commercialKeywords = ['best', 'buy', 'price', 'cost', 'review', 'comparison'];
  const isCommercial = commercialKeywords.some(word => keyword.toLowerCase().includes(word));
  const baseCpc = isCommercial ? 3.50 : 1.20;
  const cpc = Math.round((baseCpc + Math.random() * 2) * 100) / 100;
  
  // Assign competition level
  const competition = difficulty > 70 ? 'high' : difficulty > 40 ? 'medium' : 'low';
  
  // Generate trend data (simplified JSON)
  const trendData = JSON.stringify({
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100) + 50)
  });
  
  return {
    keyword,
    search_volume,
    difficulty: Math.round(difficulty * 100) / 100, // Round to 2 decimal places
    cpc,
    competition: competition as 'low' | 'medium' | 'high',
    trend_data: trendData
  };
}