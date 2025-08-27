import { z } from 'zod';

// Keyword research schema
export const keywordSchema = z.object({
  id: z.number(),
  keyword: z.string(),
  search_volume: z.number().int().nonnegative(),
  difficulty: z.number().min(0).max(100), // SEO difficulty score 0-100
  cpc: z.number().nonnegative(), // Cost per click
  competition: z.enum(['low', 'medium', 'high']),
  trend_data: z.string().nullable(), // JSON string of trend data
  created_at: z.coerce.date()
});

export type Keyword = z.infer<typeof keywordSchema>;

export const createKeywordInputSchema = z.object({
  keyword: z.string().min(1),
  search_volume: z.number().int().nonnegative(),
  difficulty: z.number().min(0).max(100),
  cpc: z.number().nonnegative(),
  competition: z.enum(['low', 'medium', 'high']),
  trend_data: z.string().nullable()
});

export type CreateKeywordInput = z.infer<typeof createKeywordInputSchema>;

// Competitor analysis schema
export const competitorSchema = z.object({
  id: z.number(),
  domain: z.string(),
  title: z.string(),
  url: z.string(),
  meta_description: z.string().nullable(),
  word_count: z.number().int().nonnegative(),
  domain_authority: z.number().min(0).max(100),
  page_authority: z.number().min(0).max(100),
  backlinks: z.number().int().nonnegative(),
  ranking_position: z.number().int().positive(),
  target_keyword: z.string(),
  content_quality_score: z.number().min(0).max(100),
  analyzed_at: z.coerce.date()
});

export type Competitor = z.infer<typeof competitorSchema>;

export const createCompetitorInputSchema = z.object({
  domain: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  meta_description: z.string().nullable(),
  word_count: z.number().int().nonnegative(),
  domain_authority: z.number().min(0).max(100),
  page_authority: z.number().min(0).max(100),
  backlinks: z.number().int().nonnegative(),
  ranking_position: z.number().int().positive(),
  target_keyword: z.string().min(1),
  content_quality_score: z.number().min(0).max(100)
});

export type CreateCompetitorInput = z.infer<typeof createCompetitorInputSchema>;

// Content outline schema
export const contentOutlineSchema = z.object({
  id: z.number(),
  title: z.string(),
  target_keyword: z.string(),
  secondary_keywords: z.string().nullable(), // JSON array of keywords
  meta_description: z.string().nullable(),
  word_count_target: z.number().int().positive(),
  outline_structure: z.string(), // JSON structure of headings and subheadings
  seo_suggestions: z.string().nullable(), // JSON array of SEO recommendations
  content_type: z.enum(['blog_post', 'article', 'guide', 'tutorial', 'review']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_reading_time: z.number().int().positive(), // in minutes
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ContentOutline = z.infer<typeof contentOutlineSchema>;

export const createContentOutlineInputSchema = z.object({
  title: z.string().min(1),
  target_keyword: z.string().min(1),
  secondary_keywords: z.string().nullable(),
  meta_description: z.string().nullable(),
  word_count_target: z.number().int().positive(),
  outline_structure: z.string().min(1),
  seo_suggestions: z.string().nullable(),
  content_type: z.enum(['blog_post', 'article', 'guide', 'tutorial', 'review']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_reading_time: z.number().int().positive()
});

export type CreateContentOutlineInput = z.infer<typeof createContentOutlineInputSchema>;

export const updateContentOutlineInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  target_keyword: z.string().optional(),
  secondary_keywords: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  word_count_target: z.number().int().positive().optional(),
  outline_structure: z.string().optional(),
  seo_suggestions: z.string().nullable().optional(),
  content_type: z.enum(['blog_post', 'article', 'guide', 'tutorial', 'review']).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_reading_time: z.number().int().positive().optional()
});

export type UpdateContentOutlineInput = z.infer<typeof updateContentOutlineInputSchema>;

// On-page optimization suggestions schema
export const optimizationSuggestionSchema = z.object({
  id: z.number(),
  content_outline_id: z.number(),
  suggestion_type: z.enum(['title', 'meta_description', 'headings', 'internal_links', 'images', 'keyword_density', 'readability']),
  priority: z.enum(['high', 'medium', 'low']),
  suggestion: z.string(),
  current_value: z.string().nullable(),
  recommended_value: z.string().nullable(),
  impact_score: z.number().min(0).max(100), // Expected SEO impact
  is_implemented: z.boolean(),
  created_at: z.coerce.date()
});

export type OptimizationSuggestion = z.infer<typeof optimizationSuggestionSchema>;

export const createOptimizationSuggestionInputSchema = z.object({
  content_outline_id: z.number(),
  suggestion_type: z.enum(['title', 'meta_description', 'headings', 'internal_links', 'images', 'keyword_density', 'readability']),
  priority: z.enum(['high', 'medium', 'low']),
  suggestion: z.string().min(1),
  current_value: z.string().nullable(),
  recommended_value: z.string().nullable(),
  impact_score: z.number().min(0).max(100),
  is_implemented: z.boolean()
});

export type CreateOptimizationSuggestionInput = z.infer<typeof createOptimizationSuggestionInputSchema>;

// Keyword research query inputs
export const keywordResearchInputSchema = z.object({
  seed_keyword: z.string().min(1),
  location: z.string().optional(),
  language: z.string().default('en'),
  include_related: z.boolean().default(true),
  min_search_volume: z.number().int().nonnegative().default(0),
  max_difficulty: z.number().min(0).max(100).default(100)
});

export type KeywordResearchInput = z.infer<typeof keywordResearchInputSchema>;

// Competitor analysis query inputs
export const competitorAnalysisInputSchema = z.object({
  target_keyword: z.string().min(1),
  location: z.string().optional(),
  limit: z.number().int().positive().default(10)
});

export type CompetitorAnalysisInput = z.infer<typeof competitorAnalysisInputSchema>;