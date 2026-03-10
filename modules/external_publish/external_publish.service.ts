/**
 * External Publish Service (Phase 5)
 * Manages external distribution of eligible institutional and editorial content.
 * Only announcements and articles are eligible — forum content is never distributed externally.
 */

import type {
  ExternalPlatform,
  ExternalPublishContentType,
  ExternalPublishResult,
  ExternalPublishSummary,
  IExternalPublishTarget,
} from '@/modules/external_publish/types';
import { MAX_RETRY_COUNT, RETRY_DELAY_MS } from '@/modules/external_publish/types';
import { createServiceRoleClient } from '@/shared/lib/supabase-server';

// ---------------------------------------------------------------------------
// Create external publish targets for a piece of content
// ---------------------------------------------------------------------------

export async function createExternalPublishTargets(
  contentId: string,
  contentType: ExternalPublishContentType,
  platforms: ExternalPlatform[]
): Promise<IExternalPublishTarget[]> {
  const supabase = createServiceRoleClient();

  const records = platforms.map((platform) => ({
    content_id: contentId,
    content_type: contentType,
    platform,
    status: 'PENDING' as const,
    retry_count: 0,
    max_retries: MAX_RETRY_COUNT,
  }));

  const { data, error } = await supabase.from('content_external_targets').insert(records).select();

  if (error) {
    console.error('[ExternalPublish] Failed to create targets', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Get publish targets for a specific content item
// ---------------------------------------------------------------------------

export async function getExternalPublishTargets(
  contentId: string
): Promise<IExternalPublishTarget[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ExternalPublish] Failed to fetch targets', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Get a single publish target by ID
// ---------------------------------------------------------------------------

export async function getExternalPublishTargetById(
  targetId: string
): Promise<IExternalPublishTarget | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .select('*')
    .eq('id', targetId)
    .single();

  if (error) {
    console.error('[ExternalPublish] Failed to fetch target', error);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Get summary of all external publish targets (for admin monitoring)
// ---------------------------------------------------------------------------

export async function getExternalPublishSummary(): Promise<ExternalPublishSummary> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[ExternalPublish] Failed to fetch summary', error);
    return { total: 0, pending: 0, posted: 0, failed: 0, targets: [] };
  }

  const targets = (data ?? []) as IExternalPublishTarget[];

  return {
    total: targets.length,
    pending: targets.filter((t) => t.status === 'PENDING').length,
    posted: targets.filter((t) => t.status === 'POSTED').length,
    failed: targets.filter((t) => t.status === 'FAILED').length,
    targets,
  };
}

// ---------------------------------------------------------------------------
// Mark a target as posted
// ---------------------------------------------------------------------------

export async function markTargetPosted(
  targetId: string,
  externalPostId: string
): Promise<IExternalPublishTarget | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .update({
      status: 'POSTED',
      external_post_id: externalPostId,
      error_log: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .select()
    .single();

  if (error) {
    console.error('[ExternalPublish] Failed to mark posted', error);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Mark a target as failed with retry logic
// ---------------------------------------------------------------------------

export async function markTargetFailed(
  targetId: string,
  errorMessage: string
): Promise<IExternalPublishTarget | null> {
  const supabase = createServiceRoleClient();

  // Fetch current target to check retry count
  const current = await getExternalPublishTargetById(targetId);
  if (!current) return null;

  const newRetryCount = current.retry_count + 1;
  const maxRetries = current.max_retries ?? MAX_RETRY_COUNT;
  const isFinalFailure = newRetryCount >= maxRetries;

  const nextRetryAt = isFinalFailure
    ? null
    : new Date(Date.now() + RETRY_DELAY_MS * Math.pow(2, newRetryCount - 1)).toISOString();

  const { data, error } = await supabase
    .from('content_external_targets')
    .update({
      status: isFinalFailure ? 'FAILED' : 'PENDING',
      error_log: errorMessage,
      retry_count: newRetryCount,
      next_retry_at: nextRetryAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .select()
    .single();

  if (error) {
    console.error('[ExternalPublish] Failed to update target', error);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Get pending targets that are ready for retry
// ---------------------------------------------------------------------------

export async function getRetryableTargets(): Promise<IExternalPublishTarget[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .select('*')
    .eq('status', 'PENDING')
    .gt('retry_count', 0)
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('[ExternalPublish] Failed to fetch retryable targets', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Process a single external publish target (stub — real integration TBD)
// ---------------------------------------------------------------------------

export async function processExternalPublishTarget(
  target: IExternalPublishTarget
): Promise<ExternalPublishResult> {
  // This is a stub for the actual external API integration.
  // In production, this would call Facebook Graph API, Instagram API, etc.
  // For now, we log the attempt and return a pending status.

  console.warn(
    `[ExternalPublish] Processing target ${target.id} for ${target.platform} (content: ${target.content_id})`
  );

  // Validate that the content type is eligible
  if (target.content_type !== 'ANNOUNCEMENT' && target.content_type !== 'ARTICLE') {
    await markTargetFailed(target.id, 'Ineligible content type for external distribution');
    return {
      target_id: target.id,
      platform: target.platform,
      status: 'FAILED',
      error: 'Ineligible content type',
    };
  }

  // Stub: In production, this would call the external platform API
  // and either markTargetPosted or markTargetFailed based on the response.
  return {
    target_id: target.id,
    platform: target.platform,
    status: 'PENDING',
  };
}

// ---------------------------------------------------------------------------
// Cancel a pending external publish target
// ---------------------------------------------------------------------------

export async function cancelExternalPublishTarget(
  targetId: string
): Promise<IExternalPublishTarget | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_external_targets')
    .update({
      status: 'FAILED',
      error_log: 'Cancelled by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error) {
    console.error('[ExternalPublish] Failed to cancel target', error);
    return null;
  }

  return data;
}
