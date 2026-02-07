import { describe, it, expect } from 'vitest';
import {
  findForbiddenWords,
  removeForbiddenWords,
  cleanTags,
  validateAndCleanContent,
  filterAIResponse,
} from './contentQualityFilter';

describe('Content Quality Filter', () => {
  describe('findForbiddenWords', () => {
    it('should detect watermark-related words', () => {
      expect(findForbiddenWords('Image with watermark overlay')).toContain('watermark');
      expect(findForbiddenWords('Company logo visible')).toContain('logo');
      expect(findForbiddenWords('Copyrighted material')).toContain('Copyrighted');
    });

    it('should detect multiple forbidden words', () => {
      const result = findForbiddenWords('Watermarked image with logo and signature');
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should be case insensitive', () => {
      expect(findForbiddenWords('WATERMARK').length).toBeGreaterThan(0);
      expect(findForbiddenWords('WaterMark').length).toBeGreaterThan(0);
      expect(findForbiddenWords('watermark').length).toBeGreaterThan(0);
    });

    it('should return empty array for clean text', () => {
      expect(findForbiddenWords('Beautiful sunset over mountains')).toHaveLength(0);
    });

    it('should detect stock photo references', () => {
      expect(findForbiddenWords('Stock photo of nature').length).toBeGreaterThan(0);
      expect(findForbiddenWords('Sample image for testing').length).toBeGreaterThan(0);
    });
  });

  describe('removeForbiddenWords', () => {
    it('should remove watermark word', () => {
      const result = removeForbiddenWords('Image with watermark visible');
      expect(result.toLowerCase()).not.toContain('watermark');
      expect(result).toContain('Image');
      expect(result).toContain('visible');
    });

    it('should remove logo word', () => {
      const result = removeForbiddenWords('Company logo on product');
      expect(result.toLowerCase()).not.toContain('logo');
    });

    it('should clean up extra spaces', () => {
      const result = removeForbiddenWords('Text with watermark here');
      expect(result).not.toContain('  '); // No double spaces
    });

    it('should preserve clean text', () => {
      const original = 'Beautiful mountain landscape at sunset';
      expect(removeForbiddenWords(original)).toBe(original);
    });
  });

  describe('cleanTags', () => {
    it('should remove tags containing forbidden words', () => {
      const tags = 'nature, watermark, sunset, logo, mountains';
      const result = cleanTags(tags);
      expect(result).not.toContain('watermark');
      expect(result).not.toContain('logo');
      expect(result).toContain('nature');
      expect(result).toContain('sunset');
      expect(result).toContain('mountains');
    });

    it('should preserve clean tags', () => {
      const tags = 'nature, sunset, mountains, travel';
      expect(cleanTags(tags)).toBe('nature, sunset, mountains, travel');
    });

    it('should handle empty input', () => {
      expect(cleanTags('')).toBe('');
    });
  });

  describe('validateAndCleanContent', () => {
    it('should detect issues in all fields', () => {
      const result = validateAndCleanContent({
        title: 'Image with watermark',
        description: 'Photo with visible logo',
        tags: 'nature, watermark, sunset',
        prompt: 'Create image with copyright notice',
      });

      expect(result.hasIssues).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should auto-clean all fields', () => {
      const result = validateAndCleanContent({
        title: 'Beautiful watermark sunset',
        description: 'Amazing logo photo',
        tags: 'nature, watermark, sunset',
        prompt: 'Create beautiful copyright image',
      });

      expect(result.autoCleanedData.title.toLowerCase()).not.toContain('watermark');
      expect(result.autoCleanedData.description.toLowerCase()).not.toContain('logo');
      expect(result.autoCleanedData.tags.toLowerCase()).not.toContain('watermark');
      expect(result.autoCleanedData.prompt.toLowerCase()).not.toContain('copyright');
    });

    it('should return no issues for clean content', () => {
      const result = validateAndCleanContent({
        title: 'Beautiful mountain sunset',
        description: 'Stunning landscape photography',
        tags: 'nature, sunset, mountains',
        prompt: 'Create beautiful landscape image',
      });

      expect(result.hasIssues).toBe(false);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('filterAIResponse', () => {
    it('should filter and flag response with issues', () => {
      const result = filterAIResponse({
        prompt: 'Create image with watermark',
        title: 'Logo design concept',
        description: 'Beautiful stock photo',
        tags: 'nature, watermark, sunset',
        category: 'Nature',
      });

      expect(result.wasFiltered).toBe(true);
      expect(result.filteredWords.length).toBeGreaterThan(0);
      expect(result.prompt.toLowerCase()).not.toContain('watermark');
      expect(result.title.toLowerCase()).not.toContain('logo');
      expect(result.tags.toLowerCase()).not.toContain('watermark');
    });

    it('should preserve category', () => {
      const result = filterAIResponse({
        prompt: 'Create image',
        title: 'Mountain sunset',
        description: 'Beautiful landscape',
        tags: 'nature, sunset',
        category: 'Nature',
      });

      expect(result.category).toBe('Nature');
    });

    it('should flag clean response as not filtered', () => {
      const result = filterAIResponse({
        prompt: 'Create beautiful sunset image',
        title: 'Golden mountain sunset',
        description: 'Stunning landscape photography',
        tags: 'nature, sunset, mountains',
      });

      expect(result.wasFiltered).toBe(false);
      expect(result.filteredWords).toHaveLength(0);
    });
  });
});
