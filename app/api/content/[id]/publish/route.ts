import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { NextRequest } from 'next/server';

/**
 * POST /api/content/[id]/publish
 * Publish a draft content (transition from DRAFT to PUBLISHED)
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentId = params.id;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return unauthorizedError();
    }

    // Get current content
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      return standardResponse({ error: 'Content not found' }, 404, APP_ERROR.NOT_FOUND);
    }

    // Check if user is author or admin
    if (content.author_id !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return standardResponse({ error: 'User not found' }, 404, APP_ERROR.NOT_FOUND);
      }

      const { data: roleData } = await supabase
        .from('roles')
        .select('name')
        .eq('id', userData.role_id)
        .single();

      if (!roleData || roleData.name !== 'SUPER_ADMIN') {
        return standardResponse(
          { error: 'Forbidden: Only content author or admin can publish' },
          403,
          APP_ERROR.FORBIDDEN
        );
      }
    }

    // Update content status to PUBLISHED
    const now = new Date().toISOString();
    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update({
        status: 'PUBLISHED',
        published_at: now,
        updated_at: now,
      })
      .eq('id', contentId)
      .select()
      .single();

    if (updateError) {
      return standardResponse({ error: updateError.message }, 500, APP_ERROR.DATABASE_ERROR);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      content_id: contentId,
      actor_id: user.id,
      action: 'PUBLISH',
      diff: {
        before: { status: content.status },
        after: { status: 'PUBLISHED', published_at: now },
      },
    });

    return standardResponse({
      data: updatedContent,
      message: 'Content published successfully',
    });
  } catch (err) {
    return standardResponse(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500,
      APP_ERROR.INTERNAL_ERROR
    );
  }
}
