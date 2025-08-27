import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type Competitor } from '../schema';
import { desc } from 'drizzle-orm';

export const getCompetitors = async (): Promise<Competitor[]> => {
  try {
    // Fetch all competitors ordered by analysis date (most recent first)
    const results = await db.select()
      .from(competitorsTable)
      .orderBy(desc(competitorsTable.analyzed_at))
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(competitor => ({
      ...competitor,
      domain_authority: parseFloat(competitor.domain_authority),
      page_authority: parseFloat(competitor.page_authority),
      content_quality_score: parseFloat(competitor.content_quality_score)
    }));
  } catch (error) {
    console.error('Failed to fetch competitors:', error);
    throw error;
  }
};