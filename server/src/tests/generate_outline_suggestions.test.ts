import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { generateOutlineSuggestions } from '../handlers/generate_outline_suggestions';
import { eq } from 'drizzle-orm';

describe('generateOutlineSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a blog post outline', async () => {
    const result = await generateOutlineSuggestions('digital marketing', 'blog_post');

    // Basic field validation
    expect(result.target_keyword).toBe('digital marketing');
    expect(result.content_type).toBe('blog_post');
    expect(result.title).toContain('digital marketing');
    expect(result.difficulty_level).toBe('beginner');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Word count should be within blog post range (800-2000)
    expect(result.word_count_target).toBeGreaterThanOrEqual(800);
    expect(result.word_count_target).toBeLessThanOrEqual(2000);

    // Reading time should be reasonable (calculated from word count)
    expect(result.estimated_reading_time).toBeGreaterThan(0);
    expect(result.estimated_reading_time).toBeLessThanOrEqual(40); // Blog posts can take up to 40 minutes for 2000 words

    // JSON fields should be parseable
    const secondaryKeywords = JSON.parse(result.secondary_keywords!);
    expect(Array.isArray(secondaryKeywords)).toBe(true);
    expect(secondaryKeywords.length).toBeGreaterThan(0);

    const outlineStructure = JSON.parse(result.outline_structure);
    expect(outlineStructure).toHaveProperty('introduction');
    expect(outlineStructure).toHaveProperty('mainSections');
    expect(outlineStructure).toHaveProperty('conclusion');

    const seoSuggestions = JSON.parse(result.seo_suggestions!);
    expect(Array.isArray(seoSuggestions)).toBe(true);
    expect(seoSuggestions.length).toBeGreaterThan(0);

    // Meta description should be present and reasonable length
    expect(result.meta_description).toBeDefined();
    expect(result.meta_description!.length).toBeLessThan(200);
  });

  it('should generate a guide outline with advanced difficulty', async () => {
    const result = await generateOutlineSuggestions('machine learning algorithms', 'guide');

    expect(result.target_keyword).toBe('machine learning algorithms');
    expect(result.content_type).toBe('guide');
    expect(result.difficulty_level).toBe('advanced');

    // Guide should have higher word count range (1500-4000)
    expect(result.word_count_target).toBeGreaterThanOrEqual(1500);
    expect(result.word_count_target).toBeLessThanOrEqual(4000);

    // Outline should contain step-by-step sections
    const outlineStructure = JSON.parse(result.outline_structure);
    expect(outlineStructure.mainSections.length).toBeGreaterThan(3);
    
    // At least one section should mention "Step"
    const hasStepSection = outlineStructure.mainSections.some((section: any) => 
      section.title.toLowerCase().includes('step')
    );
    expect(hasStepSection).toBe(true);
  });

  it('should generate a tutorial outline', async () => {
    const result = await generateOutlineSuggestions('React hooks', 'tutorial');

    expect(result.target_keyword).toBe('React hooks');
    expect(result.content_type).toBe('tutorial');

    // Tutorial should have specific word count range (1000-2500)
    expect(result.word_count_target).toBeGreaterThanOrEqual(1000);
    expect(result.word_count_target).toBeLessThanOrEqual(2500);

    // SEO suggestions should include tutorial-specific recommendations
    const seoSuggestions = JSON.parse(result.seo_suggestions!);
    const hasCodeSuggestion = seoSuggestions.some((suggestion: string) => 
      suggestion.toLowerCase().includes('code') || suggestion.toLowerCase().includes('screenshot')
    );
    expect(hasCodeSuggestion).toBe(true);
  });

  it('should generate a review outline', async () => {
    const result = await generateOutlineSuggestions('project management software', 'review');

    expect(result.target_keyword).toBe('project management software');
    expect(result.content_type).toBe('review');

    // Review should have specific word count range (800-1800)
    expect(result.word_count_target).toBeGreaterThanOrEqual(800);
    expect(result.word_count_target).toBeLessThanOrEqual(1800);

    // Outline should contain review-specific sections
    const outlineStructure = JSON.parse(result.outline_structure);
    const reviewSections = outlineStructure.mainSections.some((section: any) => 
      section.title.toLowerCase().includes('pros') || 
      section.title.toLowerCase().includes('comparison') ||
      section.title.toLowerCase().includes('features')
    );
    expect(reviewSections).toBe(true);

    // SEO suggestions should include review-specific recommendations
    const seoSuggestions = JSON.parse(result.seo_suggestions!);
    const hasReviewSuggestion = seoSuggestions.some((suggestion: string) => 
      suggestion.toLowerCase().includes('product') || suggestion.toLowerCase().includes('comparison')
    );
    expect(hasReviewSuggestion).toBe(true);
  });

  it('should generate an article outline', async () => {
    const result = await generateOutlineSuggestions('artificial intelligence trends', 'article');

    expect(result.target_keyword).toBe('artificial intelligence trends');
    expect(result.content_type).toBe('article');
    expect(result.difficulty_level).toBe('intermediate');

    // Article should have higher word count range (1200-3000)
    expect(result.word_count_target).toBeGreaterThanOrEqual(1200);
    expect(result.word_count_target).toBeLessThanOrEqual(3000);

    // Article should have research-focused sections
    const outlineStructure = JSON.parse(result.outline_structure);
    const hasAnalysisSection = outlineStructure.mainSections.some((section: any) => 
      section.title.toLowerCase().includes('analysis') || 
      section.title.toLowerCase().includes('findings')
    );
    expect(hasAnalysisSection).toBe(true);
  });

  it('should save outline to database', async () => {
    const result = await generateOutlineSuggestions('content marketing', 'blog_post');

    // Query database to verify the outline was saved
    const outlines = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, result.id))
      .execute();

    expect(outlines).toHaveLength(1);
    expect(outlines[0].target_keyword).toBe('content marketing');
    expect(outlines[0].content_type).toBe('blog_post');
    expect(outlines[0].title).toContain('content marketing');
    expect(outlines[0].created_at).toBeInstanceOf(Date);
    expect(outlines[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate different outlines for the same keyword and type', async () => {
    // Generate two outlines with same parameters
    const result1 = await generateOutlineSuggestions('SEO optimization', 'guide');
    const result2 = await generateOutlineSuggestions('SEO optimization', 'guide');

    // They should have different IDs
    expect(result1.id).not.toBe(result2.id);

    // Word counts might be different (within range)
    // Since we use random generation, they could be different
    expect(result1.word_count_target).toBeGreaterThanOrEqual(1500);
    expect(result2.word_count_target).toBeGreaterThanOrEqual(1500);

    // Both should be saved to database
    const outlines = await db.select()
      .from(contentOutlinesTable)
      .execute();

    expect(outlines.length).toBeGreaterThanOrEqual(2);
  });

  it('should include target keyword in secondary keywords', async () => {
    const result = await generateOutlineSuggestions('email marketing', 'blog_post');

    const secondaryKeywords = JSON.parse(result.secondary_keywords!);
    
    // At least some secondary keywords should contain the target keyword
    const keywordsWithTarget = secondaryKeywords.filter((keyword: string) => 
      keyword.toLowerCase().includes('email marketing')
    );
    expect(keywordsWithTarget.length).toBeGreaterThan(0);
  });

  it('should throw error for invalid content type', async () => {
    await expect(
      generateOutlineSuggestions('test keyword', 'invalid_type')
    ).rejects.toThrow(/Invalid content type/i);
  });

  it('should generate proper meta description', async () => {
    const result = await generateOutlineSuggestions('social media strategy', 'article');

    expect(result.meta_description).toBeDefined();
    expect(result.meta_description).toContain('social media strategy');
    expect(result.meta_description!.length).toBeLessThan(200); // Good meta description length
    expect(result.meta_description!.length).toBeGreaterThan(50); // Not too short
  });

  it('should calculate reasonable reading time', async () => {
    const result = await generateOutlineSuggestions('data analytics', 'guide');

    // Reading time calculation in our handler:
    // baseReadingSpeed = 200 words per minute
    // For guide: readingTimeMultiplier = 3.5
    // adjustedReadingSpeed = 200 / 3.5 ≈ 57 words per minute
    // So reading time = Math.ceil(wordCountTarget / 57)
    
    const expectedAdjustedSpeed = 200 / 3.5; // ≈57 words per minute for guides
    const expectedReadingTime = Math.ceil(result.word_count_target / expectedAdjustedSpeed);
    
    expect(result.estimated_reading_time).toBe(expectedReadingTime);
    
    // Also verify it's reasonable for the content type and word count
    expect(result.estimated_reading_time).toBeGreaterThan(0);
    expect(result.estimated_reading_time).toBeGreaterThanOrEqual(25); // At least 25 minutes for guide (minimum 1500 words)
    expect(result.estimated_reading_time).toBeLessThanOrEqual(70); // At most 70 minutes for guide (maximum 4000 words)
  });
});