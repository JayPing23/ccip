import {
  createExternalPublishTargets,
  getExternalPublishSummary,
} from '@/modules/external_publish/external_publish.service';
import type { ExternalPublishRequest } from '@/modules/external_publish/types';
import { EXTERNAL_PLATFORMS } from '@/modules/external_publish/types';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canCrossPost } from '@/shared/utils/permissions';
import { externalPublishCreateLimiter } from '@/shared/utils/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

const VALID_CONTENT_TYPES = ['ANNOUNCEMENT', 'ARTICLE'] as const;

/**
 * External Publish Endpoint
 * GET  /api/external-publish — Fetch external publish summary (admin)
 * POST /api/external-publish — Create new external publish targets
 */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canCrossPost(user.role_name)) {
      return forbiddenError('Cross-post permission required');
    }

    const summary = await getExternalPublishSummary();

    return NextResponse.json(successResponse(summary), { status: 200 });
  } catch (error) {
    console.error('[External Publish GET Error]', error);
    return internalError('Failed to fetch external publish data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canCrossPost(user.role_name)) {
      return forbiddenError('Cross-post permission required');
    }

    const rateLimited = externalPublishCreateLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const body: ExternalPublishRequest = await request.json();
    const { content_id, content_type, platforms } = body;

    if (!content_id || typeof content_id !== 'string') {
      return validationError('content_id is required');
    }

    if (
      !content_type ||
      !VALID_CONTENT_TYPES.includes(content_type as (typeof VALID_CONTENT_TYPES)[number])
    ) {
      return validationError('content_type must be ANNOUNCEMENT or ARTICLE');
    }

    if (
      !Array.isArray(platforms) ||
      platforms.length === 0 ||
      !platforms.every((p: string) =>
        EXTERNAL_PLATFORMS.includes(p as (typeof EXTERNAL_PLATFORMS)[number])
      )
    ) {
      return validationError('platforms must be a non-empty array of supported platforms');
    }

    const targets = await createExternalPublishTargets(content_id, content_type, platforms);

    return NextResponse.json(successResponse(targets), { status: 201 });
  } catch (error) {
    console.error('[External Publish POST Error]', error);
    return internalError('Failed to create external publish targets');
  }
}
