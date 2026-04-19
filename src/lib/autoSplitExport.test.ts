import { describe, it, expect } from 'vitest';
import { generateExport, type Generation, type ExportFormat } from './stockPlatformFormats';

// Simulates ExportDialog's auto-split logic for any platform
function splitIntoChunks<T>(data: T[], maxRows = 5000): T[][] {
  const chunks: T[][] = [];
  if (data.length > maxRows) {
    for (let i = 0; i < data.length; i += maxRows) {
      chunks.push(data.slice(i, i + maxRows));
    }
  } else {
    chunks.push(data);
  }
  return chunks;
}

function makeGenerations(count: number): Generation[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    user_id: 'user-1',
    image_name: `image-${i}.jpg`,
    image_url: `https://example.com/image-${i}.jpg`,
    title: `Beautiful sunset over the mountains number ${i}`,
    description: `A stunning landscape photo of mountain range ${i}`,
    tags: 'nature,sunset,mountain,landscape,sky,outdoor,beautiful,scenic,travel,golden',
    prompt: 'mountain sunset landscape',
    media_type: 'image',
    category: '1',
    is_editorial: false,
    created_at: new Date().toISOString(),
  }));
}

describe('Auto-split export (6500 items)', () => {
  const dataset = makeGenerations(6500);

  it('splits 6500 items into 2 chunks (5000 + 1500)', () => {
    const chunks = splitIntoChunks(dataset, 5000);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(5000);
    expect(chunks[1].length).toBe(1500);
  });

  it.each<ExportFormat>(['shutterstock', 'freepik', 'adobe_stock'])(
    'generates valid CSV for each chunk on platform: %s',
    (format) => {
      const chunks = splitIntoChunks(dataset, 5000);
      let totalRowsAcrossFiles = 0;
      const filenames: string[] = [];

      chunks.forEach((chunk, ci) => {
        const exportData = generateExport(format, chunk);

        // Headers must exist
        expect(exportData.headers.length).toBeGreaterThan(0);
        // Each chunk produces a row per item
        expect(exportData.rows.length).toBe(chunk.length);
        // Each row matches header column count
        exportData.rows.forEach(row => {
          expect(row.length).toBe(exportData.headers.length);
        });

        const partSuffix = chunks.length > 1 ? `-part${ci + 1}` : '';
        filenames.push(`${exportData.filename}${partSuffix}.csv`);
        totalRowsAcrossFiles += exportData.rows.length;
      });

      // No data lost during splitting
      expect(totalRowsAcrossFiles).toBe(6500);
      // Distinct filenames produced for each part
      expect(new Set(filenames).size).toBe(chunks.length);
      expect(filenames[0]).toContain('part1');
      expect(filenames[1]).toContain('part2');
    }
  );

  it('keeps a single file for ≤5000 items (no split)', () => {
    const small = makeGenerations(4999);
    const chunks = splitIntoChunks(small, 5000);
    expect(chunks.length).toBe(1);
  });

  it('handles edge case: exactly 5000 items → 1 file', () => {
    const exact = makeGenerations(5000);
    const chunks = splitIntoChunks(exact, 5000);
    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(5000);
  });

  it('handles edge case: 5001 items → 2 files (5000 + 1)', () => {
    const oneOver = makeGenerations(5001);
    const chunks = splitIntoChunks(oneOver, 5000);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(5000);
    expect(chunks[1].length).toBe(1);
  });

  it('15000 items → 3 equal chunks', () => {
    const huge = makeGenerations(15000);
    const chunks = splitIntoChunks(huge, 5000);
    expect(chunks.length).toBe(3);
    chunks.forEach(c => expect(c.length).toBe(5000));
  });
});
