import { db } from '../db';
import { contentOutlinesTable } from '../db/schema';
import { type ContentOutline } from '../schema';

// Content type templates for generating realistic outlines
const CONTENT_TEMPLATES = {
  blog_post: {
    wordCountRange: [800, 2000],
    readingTimeMultiplier: 4, // Complexity factor: higher = slower reading
    sections: [
      'Introduction and hook',
      'What is [keyword]?', 
      'Benefits of [keyword]',
      'How to implement [keyword]',
      'Common mistakes to avoid',
      'Best practices and tips',
      'Conclusion and next steps'
    ]
  },
  article: {
    wordCountRange: [1200, 3000],
    readingTimeMultiplier: 4, // Complexity factor: higher = slower reading
    sections: [
      'Executive summary',
      'Background and context',
      'Key findings about [keyword]',
      'Analysis and implications',
      'Case studies and examples',
      'Future outlook',
      'Conclusion'
    ]
  },
  guide: {
    wordCountRange: [1500, 4000],
    readingTimeMultiplier: 3.5, // Complexity factor: higher = slower reading
    sections: [
      'Introduction to [keyword]',
      'Prerequisites and requirements',
      'Step 1: Getting started',
      'Step 2: Core implementation',
      'Step 3: Advanced techniques',
      'Troubleshooting common issues',
      'Resources and next steps'
    ]
  },
  tutorial: {
    wordCountRange: [1000, 2500],
    readingTimeMultiplier: 3, // Complexity factor: higher = slower reading
    sections: [
      'What you\'ll learn',
      'Tools and setup required',
      'Step-by-step walkthrough',
      'Code examples and explanations',
      'Testing and validation',
      'Common pitfalls',
      'Summary and practice exercises'
    ]
  },
  review: {
    wordCountRange: [800, 1800],
    readingTimeMultiplier: 4.5, // Complexity factor: higher = slower reading
    sections: [
      'Introduction to [keyword]',
      'Key features and specifications',
      'Pros and cons analysis',
      'Performance evaluation',
      'Comparison with alternatives',
      'Pricing and value assessment',
      'Final verdict and recommendations'
    ]
  }
};

// Generate secondary keywords based on target keyword and content type
function generateSecondaryKeywords(targetKeyword: string, contentType: keyof typeof CONTENT_TEMPLATES): string[] {
  const baseKeywords = [
    `${targetKeyword} guide`,
    `${targetKeyword} tips`,
    `how to ${targetKeyword}`,
    `${targetKeyword} benefits`
  ];

  const typeSpecificKeywords = {
    blog_post: [`${targetKeyword} explained`, `${targetKeyword} examples`],
    article: [`${targetKeyword} analysis`, `${targetKeyword} research`],
    guide: [`${targetKeyword} tutorial`, `${targetKeyword} step by step`],
    tutorial: [`${targetKeyword} walkthrough`, `learn ${targetKeyword}`],
    review: [`${targetKeyword} comparison`, `${targetKeyword} evaluation`]
  };

  return [...baseKeywords.slice(0, 2), ...typeSpecificKeywords[contentType]];
}

// Generate SEO suggestions based on content type and keyword
function generateSEOSuggestions(targetKeyword: string, contentType: keyof typeof CONTENT_TEMPLATES): string[] {
  const baseSuggestions = [
    `Include "${targetKeyword}" in the title and first paragraph`,
    'Use keyword variations naturally throughout the content',
    'Add internal links to related content',
    'Optimize images with alt text containing relevant keywords',
    'Use header tags (H1, H2, H3) to structure content'
  ];

  const typeSpecificSuggestions = {
    blog_post: [
      'Include a compelling meta description under 160 characters',
      'Add social sharing buttons to increase engagement'
    ],
    article: [
      'Include data and statistics to support claims',
      'Add author bio and credentials for authority'
    ],
    guide: [
      'Create a table of contents for easy navigation',
      'Include downloadable resources or checklists'
    ],
    tutorial: [
      'Add code snippets with proper syntax highlighting',
      'Include screenshots or video demonstrations'
    ],
    review: [
      'Include product images and specifications',
      'Add comparison tables with competitors'
    ]
  };

  return [...baseSuggestions, ...typeSpecificSuggestions[contentType]];
}

// Generate meta description based on keyword and content type
function generateMetaDescription(targetKeyword: string, contentType: keyof typeof CONTENT_TEMPLATES): string {
  const descriptions = {
    blog_post: `Discover everything you need to know about ${targetKeyword}. Learn best practices, tips, and expert insights in this comprehensive guide.`,
    article: `In-depth analysis of ${targetKeyword} with expert insights, research findings, and practical implications for your business.`,
    guide: `Complete step-by-step guide to ${targetKeyword}. Learn from basics to advanced techniques with practical examples and best practices.`,
    tutorial: `Learn ${targetKeyword} with our hands-on tutorial. Follow along with code examples and detailed explanations.`,
    review: `Honest review of ${targetKeyword}. Pros, cons, features, pricing, and comparisons to help you make an informed decision.`
  };

  return descriptions[contentType];
}

export const generateOutlineSuggestions = async (targetKeyword: string, contentType: string): Promise<ContentOutline> => {
  try {
    // Validate content type
    const validContentTypes = Object.keys(CONTENT_TEMPLATES);
    if (!validContentTypes.includes(contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${validContentTypes.join(', ')}`);
    }

    const template = CONTENT_TEMPLATES[contentType as keyof typeof CONTENT_TEMPLATES];
    
    // Generate word count target (random within range)
    const wordCountTarget = Math.floor(
      Math.random() * (template.wordCountRange[1] - template.wordCountRange[0]) + template.wordCountRange[0]
    );

    // Calculate estimated reading time (average reading speed is ~200 words per minute)
    // readingTimeMultiplier adjusts for content complexity (lower = slower reading)
    const baseReadingSpeed = 200; // words per minute
    const adjustedReadingSpeed = baseReadingSpeed / template.readingTimeMultiplier;
    const estimatedReadingTime = Math.ceil(wordCountTarget / adjustedReadingSpeed);

    // Generate outline structure
    const outlineStructure = {
      introduction: {
        title: 'Introduction',
        subsections: ['Hook and attention grabber', `Overview of ${targetKeyword}`, 'What readers will learn']
      },
      mainSections: template.sections.map((section, index) => ({
        title: section.replace('[keyword]', targetKeyword),
        subsections: [
          `Key points about ${section.toLowerCase()}`,
          'Examples and case studies',
          'Practical applications'
        ].slice(0, 2) // Keep it concise
      })),
      conclusion: {
        title: 'Conclusion',
        subsections: ['Summary of key points', 'Call to action', 'Next steps']
      }
    };

    // Generate secondary keywords
    const secondaryKeywords = generateSecondaryKeywords(targetKeyword, contentType as keyof typeof CONTENT_TEMPLATES);

    // Generate SEO suggestions
    const seoSuggestions = generateSEOSuggestions(targetKeyword, contentType as keyof typeof CONTENT_TEMPLATES);

    // Generate meta description
    const metaDescription = generateMetaDescription(targetKeyword, contentType as keyof typeof CONTENT_TEMPLATES);

    // Determine difficulty level based on content type and word count
    let difficultyLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (contentType === 'blog_post' || wordCountTarget < 1200) {
      difficultyLevel = 'beginner';
    } else if (contentType === 'guide' || contentType === 'tutorial' || wordCountTarget > 2500) {
      difficultyLevel = 'advanced';
    }

    // Generate title
    const titleTemplates = {
      blog_post: `The Complete Guide to ${targetKeyword}: Everything You Need to Know`,
      article: `${targetKeyword}: Analysis, Insights, and Best Practices for 2024`,
      guide: `Step-by-Step Guide to ${targetKeyword}: From Beginner to Expert`,
      tutorial: `Learn ${targetKeyword}: Hands-On Tutorial with Examples`,
      review: `${targetKeyword} Review: Features, Pricing, and Is It Worth It?`
    };

    const title = titleTemplates[contentType as keyof typeof titleTemplates];

    // Insert into database
    const result = await db.insert(contentOutlinesTable)
      .values({
        title,
        target_keyword: targetKeyword,
        secondary_keywords: JSON.stringify(secondaryKeywords),
        meta_description: metaDescription,
        word_count_target: wordCountTarget,
        outline_structure: JSON.stringify(outlineStructure),
        seo_suggestions: JSON.stringify(seoSuggestions),
        content_type: contentType as any,
        difficulty_level: difficultyLevel,
        estimated_reading_time: estimatedReadingTime
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const contentOutline = result[0];
    return {
      ...contentOutline,
      // No numeric fields need conversion in this table
    };

  } catch (error) {
    console.error('Content outline generation failed:', error);
    throw error;
  }
};