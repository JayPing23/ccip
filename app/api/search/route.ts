import { searchAnnouncements } from '@/modules/search/search.service';
import type { AnnouncementSearchParams, SearchSortOption } from '@/modules/search/types';
import { SEARCH_DEFAULTS, SEARCH_SORT_OPTIONS } from '@/modules/search/types';
import type { ContentTag } from '@/shared/constants/tags';
import { CONTENT_TAGS } from '@/shared/constants/tags';
import { internalError, validationError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() || undefined;
    const status = searchParams.get('status') || undefined;
    const visibility = searchParams.get('visibility') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const org = searchParams.get('org') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const page = parsePositiveInt(searchParams.get('page'), 1, 1000);
    const pageSize = parsePositiveInt(
      searchParams.get('pageSize'),
      SEARCH_DEFAULTS.PAGE_SIZE,
      SEARCH_DEFAULTS.MAX_PAGE_SIZE
    );

    // Validate status
    const VALID_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'ALL'];
    if (status && !VALID_STATUSES.includes(status)) {
      return validationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Validate visibility
    const VALID_VISIBILITIES = ['PUBLIC', 'ORG_ONLY', 'DEPT_ONLY', 'ALL'];
    if (visibility && !VALID_VISIBILITIES.includes(visibility)) {
      return validationError(`visibility must be one of: ${VALID_VISIBILITIES.join(', ')}`);
    }

    // Validate tag
    if (tag && !CONTENT_TAGS.includes(tag as ContentTag)) {
      return validationError(`tag must be one of: ${CONTENT_TAGS.join(', ')}`);
    }

    // Validate sort
    if (sort && !SEARCH_SORT_OPTIONS.includes(sort as SearchSortOption)) {
      return validationError(`sort must be one of: ${SEARCH_SORT_OPTIONS.join(', ')}`);
    }

    const params: AnnouncementSearchParams = {
      query: q,
      status: status as AnnouncementSearchParams['status'],
      visibility: visibility as AnnouncementSearchParams['visibility'],
      tag: (tag as ContentTag) ?? null,
      organizationId: org ?? null,
      sort: (sort as SearchSortOption) ?? SEARCH_DEFAULTS.SORT,
      page,
      pageSize,
    };

    const result = await searchAnnouncements(params);

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    console.error('[Search Error]', error);
    return internalError('Failed to search announcements');
  }
}
