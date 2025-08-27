import { serial, text, pgTable, timestamp, integer, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const competitionEnum = pgEnum('competition', ['low', 'medium', 'high']);
export const contentTypeEnum = pgEnum('content_type', ['blog_post', 'article', 'guide', 'tutorial', 'review']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
export const suggestionTypeEnum = pgEnum('suggestion_type', ['title', 'meta_description', 'headings', 'internal_links', 'images', 'keyword_density', 'readability']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

// Keywords table
export const keywordsTable = pgTable('keywords', {
  id: serial('id').primaryKey(),
  keyword: text('keyword').notNull(),
  search_volume: integer('search_volume').notNull(),
  difficulty: numeric('difficulty', { precision: 5, scale: 2 }).notNull(), // 0-100 with decimals
  cpc: numeric('cpc', { precision: 10, scale: 2 }).notNull(), // Cost per click in dollars
  competition: competitionEnum('competition').notNull(),
  trend_data: text('trend_data'), // JSON string, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Competitors table
export const competitorsTable = pgTable('competitors', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  meta_description: text('meta_description'), // Nullable
  word_count: integer('word_count').notNull(),
  domain_authority: numeric('domain_authority', { precision: 5, scale: 2 }).notNull(),
  page_authority: numeric('page_authority', { precision: 5, scale: 2 }).notNull(),
  backlinks: integer('backlinks').notNull(),
  ranking_position: integer('ranking_position').notNull(),
  target_keyword: text('target_keyword').notNull(),
  content_quality_score: numeric('content_quality_score', { precision: 5, scale: 2 }).notNull(),
  analyzed_at: timestamp('analyzed_at').defaultNow().notNull(),
});

// Content outlines table
export const contentOutlinesTable = pgTable('content_outlines', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  target_keyword: text('target_keyword').notNull(),
  secondary_keywords: text('secondary_keywords'), // JSON array, nullable
  meta_description: text('meta_description'), // Nullable
  word_count_target: integer('word_count_target').notNull(),
  outline_structure: text('outline_structure').notNull(), // JSON structure
  seo_suggestions: text('seo_suggestions'), // JSON array, nullable
  content_type: contentTypeEnum('content_type').notNull(),
  difficulty_level: difficultyLevelEnum('difficulty_level').notNull(),
  estimated_reading_time: integer('estimated_reading_time').notNull(), // in minutes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Optimization suggestions table
export const optimizationSuggestionsTable = pgTable('optimization_suggestions', {
  id: serial('id').primaryKey(),
  content_outline_id: integer('content_outline_id').notNull(),
  suggestion_type: suggestionTypeEnum('suggestion_type').notNull(),
  priority: priorityEnum('priority').notNull(),
  suggestion: text('suggestion').notNull(),
  current_value: text('current_value'), // Nullable
  recommended_value: text('recommended_value'), // Nullable
  impact_score: numeric('impact_score', { precision: 5, scale: 2 }).notNull(),
  is_implemented: boolean('is_implemented').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const contentOutlinesRelations = relations(contentOutlinesTable, ({ many }) => ({
  optimizationSuggestions: many(optimizationSuggestionsTable),
}));

export const optimizationSuggestionsRelations = relations(optimizationSuggestionsTable, ({ one }) => ({
  contentOutline: one(contentOutlinesTable, {
    fields: [optimizationSuggestionsTable.content_outline_id],
    references: [contentOutlinesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Keyword = typeof keywordsTable.$inferSelect;
export type NewKeyword = typeof keywordsTable.$inferInsert;

export type Competitor = typeof competitorsTable.$inferSelect;
export type NewCompetitor = typeof competitorsTable.$inferInsert;

export type ContentOutline = typeof contentOutlinesTable.$inferSelect;
export type NewContentOutline = typeof contentOutlinesTable.$inferInsert;

export type OptimizationSuggestion = typeof optimizationSuggestionsTable.$inferSelect;
export type NewOptimizationSuggestion = typeof optimizationSuggestionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  keywords: keywordsTable,
  competitors: competitorsTable,
  contentOutlines: contentOutlinesTable,
  optimizationSuggestions: optimizationSuggestionsTable,
};