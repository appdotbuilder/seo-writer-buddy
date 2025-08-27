import { db } from '../db';
import { competitorsTable } from '../db/schema';
import { type CreateCompetitorInput, type Competitor } from '../schema';

export const createCompetitor = async (input: CreateCompetitorInput): Promise<Competitor> => {
  try {
    // Insert competitor record
    const result = await db.insert(competitorsTable)
      .values({
        domain: input.domain,
        title: input.title,
        url: input.url,
        meta_description: input.meta_description,
        word_count: input.word_count,
        domain_authority: input.domain_authority.toString(), // Convert number to string for numeric column
        page_authority: input.page_authority.toString(), // Convert number to string for numeric column
        backlinks: input.backlinks,
        ranking_position: input.ranking_position,
        target_keyword: input.target_keyword,
        content_quality_score: input.content_quality_score.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const competitor = result[0];
    return {
      ...competitor,
      domain_authority: parseFloat(competitor.domain_authority), // Convert string back to number
      page_authority: parseFloat(competitor.page_authority), // Convert string back to number
      content_quality_score: parseFloat(competitor.content_quality_score) // Convert string back to number
    };
  } catch (error) {
    console.error('Competitor creation failed:', error);
    throw error;
  }
};