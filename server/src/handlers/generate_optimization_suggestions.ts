import { db } from '../db';
import { contentOutlinesTable, optimizationSuggestionsTable } from '../db/schema';
import { type OptimizationSuggestion, type CreateOptimizationSuggestionInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function generateOptimizationSuggestions(contentOutlineId: number): Promise<OptimizationSuggestion[]> {
  try {
    // Get the content outline to analyze
    const contentOutlines = await db.select()
      .from(contentOutlinesTable)
      .where(eq(contentOutlinesTable.id, contentOutlineId))
      .execute();

    if (contentOutlines.length === 0) {
      throw new Error(`Content outline with id ${contentOutlineId} not found`);
    }

    const outline = contentOutlines[0];
    const suggestions: CreateOptimizationSuggestionInput[] = [];

    // Title optimization suggestions
    const titleSuggestions = generateTitleSuggestions(outline);
    suggestions.push(...titleSuggestions);

    // Meta description optimization
    const metaSuggestions = generateMetaDescriptionSuggestions(outline);
    suggestions.push(...metaSuggestions);

    // Heading structure optimization
    const headingSuggestions = generateHeadingSuggestions(outline);
    suggestions.push(...headingSuggestions);

    // Internal linking opportunities
    const linkingSuggestions = generateInternalLinkingSuggestions(outline);
    suggestions.push(...linkingSuggestions);

    // Image optimization suggestions
    const imageSuggestions = generateImageSuggestions(outline);
    suggestions.push(...imageSuggestions);

    // Keyword density recommendations
    const keywordSuggestions = generateKeywordDensitySuggestions(outline);
    suggestions.push(...keywordSuggestions);

    // Readability improvements
    const readabilitySuggestions = generateReadabilitySuggestions(outline);
    suggestions.push(...readabilitySuggestions);

    // Insert all suggestions into database
    const insertedSuggestions = await db.insert(optimizationSuggestionsTable)
      .values(suggestions.map(suggestion => ({
        ...suggestion,
        impact_score: suggestion.impact_score.toString(), // Convert to string for numeric column
        is_implemented: false
      })))
      .returning()
      .execute();

    // Convert numeric fields back to numbers for return
    return insertedSuggestions.map(suggestion => ({
      ...suggestion,
      impact_score: parseFloat(suggestion.impact_score)
    }));
  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error);
    throw error;
  }
}

function generateTitleSuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const title = outline.title;
  const targetKeyword = outline.target_keyword;

  // Check title length (optimal 50-60 characters)
  if (title.length > 60) {
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'title',
      priority: 'high',
      suggestion: 'Title is too long for search results. Consider shortening to 50-60 characters.',
      current_value: `${title.length} characters`,
      recommended_value: '50-60 characters',
      impact_score: 85,
      is_implemented: false
    });
  } else if (title.length < 30) {
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'title',
      priority: 'medium',
      suggestion: 'Title might be too short. Consider expanding to 30-60 characters for better SEO.',
      current_value: `${title.length} characters`,
      recommended_value: '30-60 characters',
      impact_score: 70,
      is_implemented: false
    });
  }

  // Check if target keyword is in title
  if (!title.toLowerCase().includes(targetKeyword.toLowerCase())) {
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'title',
      priority: 'high',
      suggestion: 'Include the target keyword in the title for better SEO ranking.',
      current_value: title,
      recommended_value: `Title with "${targetKeyword}" included`,
      impact_score: 90,
      is_implemented: false
    });
  }

  return suggestions;
}

function generateMetaDescriptionSuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const metaDescription = outline.meta_description;
  const targetKeyword = outline.target_keyword;

  if (!metaDescription) {
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'meta_description',
      priority: 'high',
      suggestion: 'Add a meta description to improve search result click-through rates.',
      current_value: null,
      recommended_value: `150-160 character description including "${targetKeyword}"`,
      impact_score: 80,
      is_implemented: false
    });
  } else {
    // Check meta description length
    if (metaDescription.length > 160) {
      suggestions.push({
        content_outline_id: outline.id,
        suggestion_type: 'meta_description',
        priority: 'medium',
        suggestion: 'Meta description is too long and may be truncated in search results.',
        current_value: `${metaDescription.length} characters`,
        recommended_value: '150-160 characters',
        impact_score: 65,
        is_implemented: false
      });
    }

    // Check if target keyword is in meta description
    if (!metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
      suggestions.push({
        content_outline_id: outline.id,
        suggestion_type: 'meta_description',
        priority: 'medium',
        suggestion: 'Include the target keyword in meta description for better relevance.',
        current_value: metaDescription,
        recommended_value: `Meta description with "${targetKeyword}" included`,
        impact_score: 75,
        is_implemented: false
      });
    }
  }

  return suggestions;
}

function generateHeadingSuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const targetKeyword = outline.target_keyword;
  
  try {
    const outlineStructure = JSON.parse(outline.outline_structure || '{}');
    
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'headings',
      priority: 'medium',
      suggestion: 'Use H1-H6 tags in hierarchical order and include target keyword in H1 and some H2 headings.',
      current_value: 'Current heading structure',
      recommended_value: `Hierarchical headings with "${targetKeyword}" in main headings`,
      impact_score: 70,
      is_implemented: false
    });
  } catch (error) {
    // If outline structure is malformed, suggest creating proper structure
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'headings',
      priority: 'high',
      suggestion: 'Create a clear heading structure with H1-H6 tags including the target keyword.',
      current_value: 'Unstructured or missing headings',
      recommended_value: `Structured headings with "${targetKeyword}" in H1`,
      impact_score: 85,
      is_implemented: false
    });
  }

  return suggestions;
}

function generateInternalLinkingSuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];

  suggestions.push({
    content_outline_id: outline.id,
    suggestion_type: 'internal_links',
    priority: 'medium',
    suggestion: 'Add 3-5 internal links to related content to improve site structure and user engagement.',
    current_value: 'No internal linking strategy specified',
    recommended_value: '3-5 relevant internal links with descriptive anchor text',
    impact_score: 60,
    is_implemented: false
  });

  return suggestions;
}

function generateImageSuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const targetKeyword = outline.target_keyword;

  suggestions.push({
    content_outline_id: outline.id,
    suggestion_type: 'images',
    priority: 'medium',
    suggestion: 'Optimize all images with descriptive alt text, file names, and appropriate file sizes.',
    current_value: 'No image optimization specified',
    recommended_value: `Alt text including "${targetKeyword}" where relevant, compressed images`,
    impact_score: 55,
    is_implemented: false
  });

  return suggestions;
}

function generateKeywordDensitySuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const targetKeyword = outline.target_keyword;
  const secondaryKeywords = outline.secondary_keywords;

  suggestions.push({
    content_outline_id: outline.id,
    suggestion_type: 'keyword_density',
    priority: 'medium',
    suggestion: 'Maintain target keyword density of 1-2% and naturally incorporate secondary keywords.',
    current_value: 'Keyword density not optimized',
    recommended_value: `"${targetKeyword}" at 1-2% density + secondary keywords naturally distributed`,
    impact_score: 65,
    is_implemented: false
  });

  if (secondaryKeywords) {
    try {
      const keywords = JSON.parse(secondaryKeywords);
      if (Array.isArray(keywords) && keywords.length > 0) {
        suggestions.push({
          content_outline_id: outline.id,
          suggestion_type: 'keyword_density',
          priority: 'low',
          suggestion: 'Use secondary keywords naturally throughout the content to capture related search queries.',
          current_value: `${keywords.length} secondary keywords identified`,
          recommended_value: 'Natural integration of secondary keywords in subheadings and body text',
          impact_score: 50,
          is_implemented: false
        });
      }
    } catch (error) {
      // Ignore parsing errors for secondary keywords
    }
  }

  return suggestions;
}

function generateReadabilitySuggestions(outline: any): CreateOptimizationSuggestionInput[] {
  const suggestions: CreateOptimizationSuggestionInput[] = [];
  const wordCountTarget = outline.word_count_target;
  const difficultyLevel = outline.difficulty_level;

  // Suggest readability improvements based on difficulty level
  let readabilityTarget = 'Grade 8-10 reading level';
  if (difficultyLevel === 'beginner') {
    readabilityTarget = 'Grade 6-8 reading level';
  } else if (difficultyLevel === 'advanced') {
    readabilityTarget = 'Grade 10-12 reading level';
  }

  suggestions.push({
    content_outline_id: outline.id,
    suggestion_type: 'readability',
    priority: 'medium',
    suggestion: `Optimize content readability for ${difficultyLevel} level audience using short paragraphs, bullet points, and clear language.`,
    current_value: `Target: ${difficultyLevel} level content`,
    recommended_value: `${readabilityTarget}, short paragraphs (2-3 sentences), bullet points, subheadings every 200-300 words`,
    impact_score: 60,
    is_implemented: false
  });

  // Word count suggestions
  if (wordCountTarget < 300) {
    suggestions.push({
      content_outline_id: outline.id,
      suggestion_type: 'readability',
      priority: 'high',
      suggestion: 'Increase word count to at least 300 words for better search engine ranking.',
      current_value: `${wordCountTarget} words`,
      recommended_value: 'At least 300-500 words for short content, 1000+ for comprehensive guides',
      impact_score: 75,
      is_implemented: false
    });
  }

  return suggestions;
}