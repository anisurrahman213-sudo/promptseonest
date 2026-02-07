/**
 * Content Quality Filter
 * Detects and removes forbidden words from stock metadata
 * to prevent rejection for watermark/stock logo references
 */

// Forbidden words that should not appear in stock metadata
export const FORBIDDEN_WORDS: string[] = [
  // Watermark related
  'watermark',
  'watermarked',
  'logo',
  'signature',
  'copyright',
  'copyrighted',
  'text overlay',
  'overlay text',
  'branded',
  'branding',
  'stamp',
  'stamped',
  'marked',
  'marker',
  'insignia',
  'emblem',
  'seal',
  // Stock-specific
  'stock photo',
  'stock image',
  'sample',
  'preview',
  'demo',
  'placeholder',
  'licensed',
  'royalty',
];

// Case-insensitive regex patterns for more flexible matching
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bwater\s*mark(ed|s|ing)?\b/gi,
  /\blogo(s|'s)?\b/gi,
  /\bcopyright(ed)?\b/gi,
  /\bsignature(s)?\b/gi,
  /\btext\s+overlay(s)?\b/gi,
  /\boverlay\s+text(s)?\b/gi,
  /\bbrand(ed|ing|s)?\b/gi,
  /\bstamp(ed|s)?\b/gi,
  /\bstock\s+(photo|image)(s)?\b/gi,
  /\bsample\s*(image|photo)?\b/gi,
  /\bpreview\s*(image|photo)?\b/gi,
  /\bplaceholder\b/gi,
];

export interface ContentIssue {
  field: 'title' | 'description' | 'tags' | 'prompt';
  originalValue: string;
  foundWords: string[];
  cleanedValue: string;
}

export interface ContentValidationResult {
  hasIssues: boolean;
  issues: ContentIssue[];
  autoCleanedData: {
    title: string;
    description: string;
    tags: string;
    prompt: string;
  };
}

/**
 * Find all forbidden words in a text
 */
export function findForbiddenWords(text: string): string[] {
  if (!text) return [];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check exact words
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      found.push(...matches);
    }
  }
  
  // Check patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!found.some(f => f.toLowerCase() === match.toLowerCase())) {
          found.push(match);
        }
      }
    }
  }
  
  return [...new Set(found)]; // Remove duplicates
}

/**
 * Remove forbidden words from text
 */
export function removeForbiddenWords(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove exact words
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  // Remove patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up extra spaces and commas
  cleaned = cleaned
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/,\s*$/g, '') // Remove trailing comma
    .replace(/^\s*,/g, '') // Remove leading comma
    .replace(/\s+,/g, ',') // Remove space before comma
    .replace(/,\s+/g, ', ') // Normalize comma spacing
    .trim();
  
  return cleaned;
}

/**
 * Remove forbidden words from comma-separated tags
 */
export function cleanTags(tags: string): string {
  if (!tags) return tags;
  
  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  const cleanedTags = tagList.filter(tag => {
    const foundWords = findForbiddenWords(tag);
    return foundWords.length === 0;
  });
  
  return cleanedTags.join(', ');
}

/**
 * Validate and clean content for stock platforms
 */
export function validateAndCleanContent(data: {
  title: string;
  description: string;
  tags: string;
  prompt: string;
}): ContentValidationResult {
  const issues: ContentIssue[] = [];
  
  // Check each field
  const fields: Array<'title' | 'description' | 'tags' | 'prompt'> = ['title', 'description', 'tags', 'prompt'];
  
  const autoCleanedData = { ...data };
  
  for (const field of fields) {
    const value = data[field];
    const foundWords = findForbiddenWords(value);
    
    if (foundWords.length > 0) {
      let cleanedValue: string;
      
      if (field === 'tags') {
        cleanedValue = cleanTags(value);
      } else {
        cleanedValue = removeForbiddenWords(value);
      }
      
      issues.push({
        field,
        originalValue: value,
        foundWords,
        cleanedValue,
      });
      
      autoCleanedData[field] = cleanedValue;
    }
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    autoCleanedData,
  };
}

/**
 * Filter forbidden words from AI generation results
 * Used in the analyze-image edge function
 */
export function filterAIResponse(response: {
  prompt: string;
  title: string;
  description: string;
  tags: string;
  category?: string;
}): typeof response & { wasFiltered: boolean; filteredWords: string[] } {
  const allFoundWords: string[] = [];
  
  const cleanedPrompt = removeForbiddenWords(response.prompt);
  const cleanedTitle = removeForbiddenWords(response.title);
  const cleanedDescription = removeForbiddenWords(response.description);
  const cleanedTags = cleanTags(response.tags);
  
  // Collect all found words
  allFoundWords.push(...findForbiddenWords(response.prompt));
  allFoundWords.push(...findForbiddenWords(response.title));
  allFoundWords.push(...findForbiddenWords(response.description));
  allFoundWords.push(...findForbiddenWords(response.tags));
  
  const uniqueFilteredWords = [...new Set(allFoundWords)];
  
  return {
    prompt: cleanedPrompt,
    title: cleanedTitle,
    description: cleanedDescription,
    tags: cleanedTags,
    category: response.category,
    wasFiltered: uniqueFilteredWords.length > 0,
    filteredWords: uniqueFilteredWords,
  };
}
