import {
  createContent,
  getContentBySlug,
  getPublishedContent,
} from '@/modules/content/content.service';
import { announcementSchema } from '@/modules/content/schemas/content.schema';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canCreateContent } from '@/shared/utils/permissions';
import { contentCreateLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Content Endpoints
 * GET /api/content - List published content or fetch by slug
 * POST /api/content - Create new content (requires permission)
 */

export async function GET(request: NextRequest) {
  try {
    // Check if slug query parameter is provided
    const slug = request.nextUrl.searchParams.get('slug');

    if (slug) {
      // Fetch by slug
      const content = await getContentBySlug(slug);
      if (!content) {
        return notFoundError('Content not found');
      }
      return NextResponse.json(successResponse(content), { status: 200 });
    }

    // List all published content
    const content = await getPublishedContent();
    return NextResponse.json(successResponse(content), { status: 200 });
  } catch (error) {
    console.error('[Get Content Error]', error);
    return internalError('Failed to fetch content');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Rate limit by user ID
    const rateLimited = contentCreateLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    // Check permission using role_name
    if (!user.role_name || !canCreateContent(user.role_name)) {
      return forbiddenError('You do not have permission to create content');
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = announcementSchema.safeParse(body);

    if (!validated.success) {
      console.error('[Validation Error]', validated.error);
      return validationError('Invalid content data');
    }

    // Use description or body (form sends description, API may send body)
    const contentBody = validated.data.body || validated.data.description || '';
    const status = validated.data.status || 'DRAFT';
    const org_ids = validated.data.org_ids || [];

    // Create content
    const content = await createContent(
      validated.data.title,
      contentBody,
      status,
      validated.data.visibility,
      org_ids,
      user.id,
      validated.data.scheduled_at
    );

    return NextResponse.json(successResponse(content), { status: 201 });
  } catch (error) {
    console.error('[Create Content Error]', error);
    return internalError('Failed to create content');
  }
}
