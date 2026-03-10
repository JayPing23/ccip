import { getCategories, getCategoryBySlug } from '@/modules/forum/forum.service';
import { internalError, notFoundError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Forum Category Endpoints
 * GET /api/forum/categories       — List all categories
 * GET /api/forum/categories?slug= — Fetch a single category by slug
 */

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (slug) {
      const category = await getCategoryBySlug(slug);
      if (!category) return notFoundError('Category not found');
      return NextResponse.json(successResponse(category), { status: 200 });
    }

    const categories = await getCategories();
    return NextResponse.json(successResponse(categories), { status: 200 });
  } catch (error) {
    console.error('[Get Forum Categories Error]', error);
    return internalError('Failed to fetch categories');
  }
}
