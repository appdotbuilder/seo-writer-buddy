import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  keywordResearchInputSchema,
  createKeywordInputSchema,
  competitorAnalysisInputSchema,
  createCompetitorInputSchema,
  createContentOutlineInputSchema,
  updateContentOutlineInputSchema,
  createOptimizationSuggestionInputSchema
} from './schema';

// Import handlers
import { performKeywordResearch } from './handlers/keyword_research';
import { createKeyword } from './handlers/create_keyword';
import { getKeywords } from './handlers/get_keywords';
import { performCompetitorAnalysis } from './handlers/competitor_analysis';
import { createCompetitor } from './handlers/create_competitor';
import { getCompetitors } from './handlers/get_competitors';
import { createContentOutline } from './handlers/create_content_outline';
import { updateContentOutline } from './handlers/update_content_outline';
import { getContentOutlines } from './handlers/get_content_outlines';
import { getContentOutlineById } from './handlers/get_content_outline_by_id';
import { generateOutlineSuggestions } from './handlers/generate_outline_suggestions';
import { createOptimizationSuggestion } from './handlers/create_optimization_suggestion';
import { getOptimizationSuggestions } from './handlers/get_optimization_suggestions';
import { generateOptimizationSuggestions } from './handlers/generate_optimization_suggestions';
import { updateSuggestionStatus } from './handlers/update_suggestion_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Keyword Research Routes
  performKeywordResearch: publicProcedure
    .input(keywordResearchInputSchema)
    .query(({ input }) => performKeywordResearch(input)),

  createKeyword: publicProcedure
    .input(createKeywordInputSchema)
    .mutation(({ input }) => createKeyword(input)),

  getKeywords: publicProcedure
    .query(() => getKeywords()),

  // Competitor Analysis Routes
  performCompetitorAnalysis: publicProcedure
    .input(competitorAnalysisInputSchema)
    .query(({ input }) => performCompetitorAnalysis(input)),

  createCompetitor: publicProcedure
    .input(createCompetitorInputSchema)
    .mutation(({ input }) => createCompetitor(input)),

  getCompetitors: publicProcedure
    .query(() => getCompetitors()),

  // Content Outline Routes
  createContentOutline: publicProcedure
    .input(createContentOutlineInputSchema)
    .mutation(({ input }) => createContentOutline(input)),

  updateContentOutline: publicProcedure
    .input(updateContentOutlineInputSchema)
    .mutation(({ input }) => updateContentOutline(input)),

  getContentOutlines: publicProcedure
    .query(() => getContentOutlines()),

  getContentOutlineById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getContentOutlineById(input.id)),

  generateOutlineSuggestions: publicProcedure
    .input(z.object({ 
      targetKeyword: z.string().min(1), 
      contentType: z.string().min(1) 
    }))
    .mutation(({ input }) => generateOutlineSuggestions(input.targetKeyword, input.contentType)),

  // Optimization Suggestions Routes
  createOptimizationSuggestion: publicProcedure
    .input(createOptimizationSuggestionInputSchema)
    .mutation(({ input }) => createOptimizationSuggestion(input)),

  getOptimizationSuggestions: publicProcedure
    .input(z.object({ contentOutlineId: z.number() }))
    .query(({ input }) => getOptimizationSuggestions(input.contentOutlineId)),

  generateOptimizationSuggestions: publicProcedure
    .input(z.object({ contentOutlineId: z.number() }))
    .mutation(({ input }) => generateOptimizationSuggestions(input.contentOutlineId)),

  updateSuggestionStatus: publicProcedure
    .input(z.object({ 
      suggestionId: z.number(), 
      isImplemented: z.boolean() 
    }))
    .mutation(({ input }) => updateSuggestionStatus(input.suggestionId, input.isImplemented)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`SEO Content Creation TRPC server listening at port: ${port}`);
}

start();