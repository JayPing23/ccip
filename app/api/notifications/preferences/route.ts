import { getPreferences, upsertPreference } from '@/modules/notifications/notifications.service';
import type { NotificationPreferenceInput } from '@/modules/notifications/types';
import { DIGEST_OPTIONS } from '@/modules/notifications/types';
import { getCurrentUser } from '@/modules/users/users.service';
import { internalError, unauthorizedError, validationError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const preferences = await getPreferences(user.id);

    return NextResponse.json(successResponse(preferences), { status: 200 });
  } catch (error) {
    console.error('[Get Notification Preferences Error]', error);
    return internalError('Failed to fetch notification preferences');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const body: unknown = await request.json();

    if (!body || typeof body !== 'object') {
      return validationError('Request body is required');
    }

    const { orgId, inAppEnabled, emailEnabled, emailDigest } = body as Record<string, unknown>;

    if (typeof orgId !== 'string' || !orgId.trim()) {
      return validationError('orgId is required');
    }

    if (typeof inAppEnabled !== 'boolean') {
      return validationError('inAppEnabled must be a boolean');
    }

    if (typeof emailEnabled !== 'boolean') {
      return validationError('emailEnabled must be a boolean');
    }

    if (typeof emailDigest !== 'string' || !DIGEST_OPTIONS.includes(emailDigest as never)) {
      return validationError(`emailDigest must be one of: ${DIGEST_OPTIONS.join(', ')}`);
    }

    const input: NotificationPreferenceInput = {
      orgId: orgId.trim(),
      inAppEnabled,
      emailEnabled,
      emailDigest: emailDigest as NotificationPreferenceInput['emailDigest'],
    };

    const preference = await upsertPreference(user.id, input);

    return NextResponse.json(successResponse(preference), { status: 200 });
  } catch (error) {
    console.error('[Upsert Notification Preference Error]', error);
    return internalError('Failed to save notification preference');
  }
}
