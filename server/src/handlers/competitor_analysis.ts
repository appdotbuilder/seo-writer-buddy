import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type CompetitorAnalysisInput, type Competitor } from '../schema';
import { eq, desc, and } from 'drizzle-orm';

export async function performCompetitorAnalysis(input: CompetitorAnalysisInput): Promise<Competitor[]> {
  try {
    // First, check if we have existing competitor data for this keyword
    const results = await db.select()
      .from(competitorsTable)
      .where(eq(competitorsTable.target_keyword, input.target_keyword))
      .orderBy(competitorsTable.ranking_position)
      .limit(input.limit)
      .execute();

    // Convert numeric fields back to numbers before returning
    const competitors = results.map(competitor => ({
      ...competitor,
      domain_authority: parseFloat(competitor.domain_authority),
      page_authority: parseFloat(competitor.page_authority),
      content_quality_score: parseFloat(competitor.content_quality_score)
    }));

    // If we have existing data, return it
    if (competitors.length > 0) {
      return competitors;
    }

    // If no existing data, generate mock competitor analysis data
    // This simulates what a real competitor analysis API would return
    const mockCompetitors: Competitor[] = [];
    const domains = [
      'wikipedia.org', 'medium.com', 'hubspot.com', 'moz.com', 'searchengineland.com',
      'backlinko.com', 'ahrefs.com', 'semrush.com', 'neilpatel.com', 'contentmarketinginstitute.com'
    ];

    for (let i = 0; i < Math.min(input.limit, domains.length); i++) {
      const domain = domains[i];
      const rankingPosition = i + 1;
      
      // Create realistic competitor data based on ranking position
      const baseAuthority = Math.max(95 - (rankingPosition * 8), 30);
      const variance = Math.random() * 10 - 5; // ±5 variation
      
      mockCompetitors.push({
        id: 0, // Will be set by database
        domain,
        title: `${input.target_keyword} - Complete Guide | ${domain.split('.')[0]}`,
        url: `https://${domain}/${input.target_keyword.toLowerCase().replace(/\s+/g, '-')}`,
        meta_description: `Learn everything about ${input.target_keyword} with our comprehensive guide. Expert insights, tips, and strategies.`,
        word_count: Math.floor(Math.random() * 2000) + 1500, // 1500-3500 words
        domain_authority: Math.round(Math.max(baseAuthority + variance, 10)),
        page_authority: Math.round(Math.max((baseAuthority - 5) + variance, 5)),
        backlinks: Math.floor(Math.random() * 1000) + (100 * (11 - rankingPosition)),
        ranking_position: rankingPosition,
        target_keyword: input.target_keyword,
        content_quality_score: Math.round(Math.max(90 - (rankingPosition * 3) + variance, 40)),
        analyzed_at: new Date()
      });
    }

    // Store the mock data in the database for future use
    if (mockCompetitors.length > 0) {
      const insertValues = mockCompetitors.map(competitor => ({
        domain: competitor.domain,
        title: competitor.title,
        url: competitor.url,
        meta_description: competitor.meta_description,
        word_count: competitor.word_count,
        domain_authority: competitor.domain_authority.toString(),
        page_authority: competitor.page_authority.toString(),
        backlinks: competitor.backlinks,
        ranking_position: competitor.ranking_position,
        target_keyword: competitor.target_keyword,
        content_quality_score: competitor.content_quality_score.toString()
      }));

      const insertedCompetitors = await db.insert(competitorsTable)
        .values(insertValues)
        .returning()
        .execute();

      // Convert numeric fields back to numbers
      return insertedCompetitors.map(competitor => ({
        ...competitor,
        domain_authority: parseFloat(competitor.domain_authority),
        page_authority: parseFloat(competitor.page_authority),
        content_quality_score: parseFloat(competitor.content_quality_score)
      }));
    }

    return [];
  } catch (error) {
    console.error('Competitor analysis failed:', error);
    throw error;
  }
}