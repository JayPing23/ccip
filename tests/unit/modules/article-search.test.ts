import type { IArticle } from '@/modules/publication/types';
import type { ArticleSearchResult } from '@/modules/search/types';
import { SEARCH_DEFAULTS, SEARCH_SORT_OPTIONS } from '@/modules/search/types';

const baseArticle: IArticle = {
  id: 'article-1',
  title: 'Student Council Elections Approaching',
  body: 'The annual student council elections are scheduled for next month.',
  slug: 'student-council-elections-approaching',
  excerpt: 'Elections are coming up next month.',
  section: 'NEWS',
  status: 'PUBLISHED',
  author_id: 'user-1',
  reviewer_id: null,
  review_note: null,
  published_at: '2026-03-09T12:00:00.000Z',
  deleted_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('article search types and defaults', () => {
  it('SEARCH_DEFAULTS has expected values', () => {
    expect(SEARCH_DEFAULTS.PAGE_SIZE).toBe(20);
    expect(SEARCH_DEFAULTS.MAX_PAGE_SIZE).toBe(100);
    expect(SEARCH_DEFAULTS.SORT).toBe('relevance');
  });

  it('SEARCH_SORT_OPTIONS includes all expected values', () => {
    expect(SEARCH_SORT_OPTIONS).toContain('relevance');
    expect(SEARCH_SORT_OPTIONS).toContain('newest');
    expect(SEARCH_SORT_OPTIONS).toContain('oldest');
  });

  describe('ArticleSearchResult shape', () => {
    it('wraps an article with matchedFields', () => {
      const result: ArticleSearchResult = {
        article: baseArticle,
        matchedFields: ['title', 'excerpt'],
      };

      expect(result.article.id).toBe('article-1');
      expect(result.matchedFields).toContain('title');
      expect(result.matchedFields).toContain('excerpt');
    });

    it('supports empty matchedFields for unfiltered results', () => {
      const result: ArticleSearchResult = {
        article: baseArticle,
        matchedFields: [],
      };

      expect(result.matchedFields).toHaveLength(0);
    });

    it('supports body as a matched field', () => {
      const result: ArticleSearchResult = {
        article: baseArticle,
        matchedFields: ['body'],
      };

      expect(result.matchedFields).toContain('body');
    });
  });
});

describe('article search client-side matching logic', () => {
  function getArticleMatchedFields(
    article: IArticle,
    normalizedQuery: string
  ): ArticleSearchResult['matchedFields'] {
    if (!normalizedQuery) return [];

    const matched: ArticleSearchResult['matchedFields'] = [];

    if (article.title.toLowerCase().includes(normalizedQuery)) {
      matched.push('title');
    }
    if (article.body.toLowerCase().includes(normalizedQuery)) {
      matched.push('body');
    }
    if (article.excerpt?.toLowerCase().includes(normalizedQuery)) {
      matched.push('excerpt');
    }

    return matched;
  }

  it('matches title', () => {
    const fields = getArticleMatchedFields(baseArticle, 'council');
    expect(fields).toContain('title');
  });

  it('matches body', () => {
    const fields = getArticleMatchedFields(baseArticle, 'scheduled');
    expect(fields).toContain('body');
  });

  it('matches excerpt', () => {
    const fields = getArticleMatchedFields(baseArticle, 'coming up');
    expect(fields).toContain('excerpt');
  });

  it('returns empty for non-matching query', () => {
    const fields = getArticleMatchedFields(baseArticle, 'nonexistent');
    expect(fields).toHaveLength(0);
  });

  it('returns empty for empty query', () => {
    const fields = getArticleMatchedFields(baseArticle, '');
    expect(fields).toHaveLength(0);
  });

  it('handles null excerpt gracefully', () => {
    const articleNoExcerpt = { ...baseArticle, excerpt: null };
    const fields = getArticleMatchedFields(articleNoExcerpt, 'council');
    expect(fields).toContain('title');
    expect(fields).not.toContain('excerpt');
  });
});
