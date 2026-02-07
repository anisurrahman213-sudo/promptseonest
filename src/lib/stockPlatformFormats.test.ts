import { describe, it, expect } from 'vitest';
import { generateExport, stockPlatforms, validateAdobeStockExport, type Generation } from './stockPlatformFormats';

describe('Adobe Stock CSV Export', () => {
  const mockGenerations: Generation[] = [
    {
      id: '1',
      image_name: 'test-image.jpg',
      image_url: 'https://example.com/test.jpg',
      prompt: 'A beautiful sunset',
      title: 'Golden Sunset Over Mountains',
      description: 'A stunning view of sunset over mountain peaks with golden colors',
      tags: 'sunset, mountains, nature, landscape, golden hour, scenic, outdoor, sky, clouds, beautiful',
      created_at: '2024-01-15T10:30:00Z',
      category: 'Nature',
      is_editorial: false,
    },
    {
      id: '2',
      image_name: 'business-meeting.png',
      image_url: 'https://example.com/meeting.png',
      prompt: 'Business meeting in office',
      title: 'Professional Team Meeting',
      description: 'Corporate team having a business discussion in modern office',
      tags: 'business, meeting, office, team, corporate, professional, work, collaboration',
      created_at: '2024-01-16T14:00:00Z',
      category: 'Business',
      is_editorial: false,
    },
  ];

  it('should have correct Adobe Stock platform definition', () => {
    const adobePlatform = stockPlatforms.find(p => p.id === 'adobe_stock');
    
    expect(adobePlatform).toBeDefined();
    expect(adobePlatform?.maxKeywords).toBe(49);
    expect(adobePlatform?.maxTitleLength).toBe(200);
    expect(adobePlatform?.csvColumns).toEqual([
      'Filename', 'Title', 'Keywords', 'Category', 'Editorial', 'Mature content', 'Releases'
    ]);
  });

  it('should generate correct Adobe Stock CSV headers', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    expect(result.headers).toEqual([
      'Filename',
      'Title', 
      'Keywords',
      'Category',
      'Editorial',
      'Mature content',
      'Releases'
    ]);
  });

  it('should have 7 columns matching the header count', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    expect(result.headers.length).toBe(7);
    result.rows.forEach((row, index) => {
      expect(row.length).toBe(7);
    });
  });

  it('should preserve exact filename for asset matching', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    // Filename should be escaped but preserve original name
    expect(result.rows[0][0]).toBe('"test-image.jpg"');
    expect(result.rows[1][0]).toBe('"business-meeting.png"');
  });

  it('should limit keywords to 49 max', () => {
    const manyKeywords = Array(60).fill('keyword').map((k, i) => `${k}${i}`).join(', ');
    const generation: Generation = {
      ...mockGenerations[0],
      tags: manyKeywords,
    };
    
    const result = generateExport('adobe_stock', [generation]);
    const keywordsCell = result.rows[0][2];
    // Remove quotes and count keywords
    const keywords = keywordsCell.replace(/^"|"$/g, '').split(', ');
    
    expect(keywords.length).toBeLessThanOrEqual(49);
  });

  it('should default Editorial to No', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    // Editorial column (index 4) should be "No" by default
    expect(result.rows[0][4]).toBe('"No"');
    expect(result.rows[1][4]).toBe('"No"');
  });

  it('should set Editorial to Yes when editorialStatus is editorial', () => {
    const result = generateExport('adobe_stock', mockGenerations, { editorialStatus: 'editorial' });
    
    expect(result.rows[0][4]).toBe('"Yes"');
    expect(result.rows[1][4]).toBe('"Yes"');
  });

  it('should default Mature content to No', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    // Mature content column (index 5) should be "No"
    expect(result.rows[0][5]).toBe('"No"');
    expect(result.rows[1][5]).toBe('"No"');
  });

  it('should have empty Releases by default', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    // Releases column (index 6) should be empty
    expect(result.rows[0][6]).toBe('""');
    expect(result.rows[1][6]).toBe('""');
  });

  it('should convert category to numeric code', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    // Nature maps to category 5, Business maps to 3
    expect(result.rows[0][3]).toBe('"5"'); // Nature -> 5
    expect(result.rows[1][3]).toBe('"3"'); // Business -> 3
  });

  it('should limit title to 200 characters', () => {
    const longTitle = 'A'.repeat(250);
    const generation: Generation = {
      ...mockGenerations[0],
      title: longTitle,
    };
    
    const result = generateExport('adobe_stock', [generation]);
    const titleCell = result.rows[0][1];
    // Remove quotes and check length
    const title = titleCell.replace(/^"|"$/g, '');
    
    expect(title.length).toBeLessThanOrEqual(200);
  });

  it('should generate correct filename prefix', () => {
    const result = generateExport('adobe_stock', mockGenerations);
    
    expect(result.filename).toBe('adobe-stock-metadata');
  });

  // New tests for title cleaning
  it('should remove colons from title', () => {
    const generation: Generation = {
      ...mockGenerations[0],
      title: 'Sunset: A Beautiful View: Nature Photography',
    };
    
    const result = generateExport('adobe_stock', [generation]);
    const titleCell = result.rows[0][1];
    
    expect(titleCell).not.toContain(':');
    expect(titleCell).toBe('"Sunset - A Beautiful View - Nature Photography"');
  });

  it('should clean extra whitespace in title', () => {
    const generation: Generation = {
      ...mockGenerations[0],
      title: 'Beautiful   Sunset   Over   Mountains',
    };
    
    const result = generateExport('adobe_stock', [generation]);
    const titleCell = result.rows[0][1];
    
    expect(titleCell).toBe('"Beautiful Sunset Over Mountains"');
  });

  // Validation tests
  it('should validate and return error for empty title', () => {
    const generationsWithEmptyTitle: Generation[] = [
      {
        ...mockGenerations[0],
        title: '',
      },
    ];
    
    const validation = validateAdobeStockExport(generationsWithEmptyTitle);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0].field).toBe('Title');
  });

  it('should validate and return error for empty keywords', () => {
    const generationsWithEmptyTags: Generation[] = [
      {
        ...mockGenerations[0],
        tags: '',
      },
    ];
    
    const validation = validateAdobeStockExport(generationsWithEmptyTags);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0].field).toBe('Keywords');
  });

  it('should validate and return errors for both empty title and keywords', () => {
    const generationsWithBothEmpty: Generation[] = [
      {
        ...mockGenerations[0],
        title: '',
        tags: '',
      },
    ];
    
    const validation = validateAdobeStockExport(generationsWithBothEmpty);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBe(2);
  });

  it('should pass validation when title and keywords are present', () => {
    const validation = validateAdobeStockExport(mockGenerations);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should validate whitespace-only title as empty', () => {
    const generationsWithWhitespaceTitle: Generation[] = [
      {
        ...mockGenerations[0],
        title: '   ',
      },
    ];
    
    const validation = validateAdobeStockExport(generationsWithWhitespaceTitle);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0].field).toBe('Title');
  });
});
