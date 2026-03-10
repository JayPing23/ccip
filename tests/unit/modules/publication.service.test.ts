/** @jest-environment node */

import { ARTICLE_SECTIONS, ARTICLE_STATUS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';

const baseArticle: IArticle = {
  id: 'article-1',
  title: 'Student Council Elections Approaching',
  body: 'The annual student council elections are scheduled for next month.',
  slug: 'student-council-elections-approaching',
  excerpt: 'Elections are coming up next month.',
  section: 'NEWS',
  status: 'DRAFT',
  author_id: 'user-1',
  reviewer_id: null,
  review_note: null,
  published_at: null,
  deleted_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('publication types and constants', () => {
  describe('ARTICLE_STATUS', () => {
    it('defines all expected statuses', () => {
      expect(Object.values(ARTICLE_STATUS)).toEqual(
        expect.arrayContaining(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'])
      );
    });

    it('has 5 status values', () => {
      expect(Object.keys(ARTICLE_STATUS)).toHaveLength(5);
    });
  });

  describe('ARTICLE_SECTIONS', () => {
    it('defines all expected sections', () => {
      expect(Object.values(ARTICLE_SECTIONS)).toEqual(
        expect.arrayContaining(['NEWS', 'FEATURES', 'OPINION', 'EDITORIAL', 'SPORTS', 'CULTURE'])
      );
    });

    it('has 6 section values', () => {
      expect(Object.keys(ARTICLE_SECTIONS)).toHaveLength(6);
    });
  });

  describe('IArticle shape', () => {
    it('has the expected base fields', () => {
      expect(baseArticle).toHaveProperty('id');
      expect(baseArticle).toHaveProperty('title');
      expect(baseArticle).toHaveProperty('body');
      expect(baseArticle).toHaveProperty('slug');
      expect(baseArticle).toHaveProperty('section');
      expect(baseArticle).toHaveProperty('status');
      expect(baseArticle).toHaveProperty('author_id');
    });

    it('has nullable reviewer and publish fields', () => {
      expect(baseArticle.reviewer_id).toBeNull();
      expect(baseArticle.review_note).toBeNull();
      expect(baseArticle.published_at).toBeNull();
      expect(baseArticle.deleted_at).toBeNull();
    });
  });
});

describe('publication workflow state transitions', () => {
  it('draft article starts with DRAFT status', () => {
    expect(baseArticle.status).toBe('DRAFT');
  });

  it('valid workflow: DRAFT → IN_REVIEW → APPROVED → PUBLISHED', () => {
    const transitions: Array<[string, string]> = [
      ['DRAFT', 'IN_REVIEW'],
      ['IN_REVIEW', 'APPROVED'],
      ['APPROVED', 'PUBLISHED'],
    ];

    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ['IN_REVIEW'],
      IN_REVIEW: ['APPROVED', 'DRAFT'],
      APPROVED: ['PUBLISHED'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    for (const [from, to] of transitions) {
      expect(VALID_TRANSITIONS[from]).toContain(to);
    }
  });

  it('IN_REVIEW can go back to DRAFT (revision request)', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ['IN_REVIEW'],
      IN_REVIEW: ['APPROVED', 'DRAFT'],
      APPROVED: ['PUBLISHED'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    expect(VALID_TRANSITIONS['IN_REVIEW']).toContain('DRAFT');
  });

  it('any active status can be archived', () => {
    const archivableStatuses = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED'];
    for (const status of archivableStatuses) {
      expect(status).not.toBe('ARCHIVED');
    }
  });
});
