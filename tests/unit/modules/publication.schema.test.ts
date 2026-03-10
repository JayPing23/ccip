/** @jest-environment node */

import {
  articleCreateSchema,
  articleUpdateSchema,
} from '@/modules/publication/schemas/article.schema';

describe('article.schema – validation', () => {
  describe('articleCreateSchema', () => {
    it('accepts a valid article payload', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Student Council Elections',
        body: 'The annual elections are coming.',
        section: 'NEWS',
      });

      expect(result.success).toBe(true);
    });

    it('accepts all sections', () => {
      const sections = ['NEWS', 'FEATURES', 'OPINION', 'EDITORIAL', 'SPORTS', 'CULTURE'];
      for (const section of sections) {
        const result = articleCreateSchema.safeParse({
          title: 'Test Article',
          section,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects title shorter than 3 chars', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Hi',
        section: 'NEWS',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing section', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid section value', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
        section: 'INVALID_SECTION',
      });
      expect(result.success).toBe(false);
    });

    it('allows optional excerpt', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
        section: 'FEATURES',
        excerpt: 'Short summary.',
      });
      expect(result.success).toBe(true);
    });

    it('allows null excerpt', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
        section: 'FEATURES',
        excerpt: null,
      });
      expect(result.success).toBe(true);
    });

    it('allows optional byline_name', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
        section: 'NEWS',
        byline_name: 'Jane Reporter',
      });
      expect(result.success).toBe(true);
    });

    it('allows optional status', () => {
      const result = articleCreateSchema.safeParse({
        title: 'Valid Title Here',
        section: 'NEWS',
        status: 'DRAFT',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('articleUpdateSchema', () => {
    it('accepts partial updates', () => {
      const result = articleUpdateSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty object (no changes)', () => {
      const result = articleUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('validates fields that are provided', () => {
      const result = articleUpdateSchema.safeParse({
        title: 'Hi',
      });
      expect(result.success).toBe(false);
    });
  });
});
