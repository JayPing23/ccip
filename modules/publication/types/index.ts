/**
 * Publication Types
 * TypeScript interfaces for the publication domain model.
 * These map to the additive `articles` and `article_authors` tables.
 */

import type { ArticleSection, ArticleStatus } from '@/modules/publication/constants';

export interface IArticle {
  id: string;
  title: string;
  body: string;
  slug: string;
  excerpt: string | null;
  section: ArticleSection;
  status: ArticleStatus;
  author_id: string;
  reviewer_id: string | null;
  review_note: string | null;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IArticleAuthor {
  article_id: string;
  user_id: string;
  role: 'primary' | 'contributor';
  byline_name: string;
  created_at: string;
}

export interface IArticleWithAuthors extends IArticle {
  article_authors?: IArticleAuthor[];
}
