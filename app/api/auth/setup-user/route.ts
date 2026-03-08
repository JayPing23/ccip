import { createServiceRoleClient } from '@/shared/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/setup-user
 *
 * Creates or updates a user in the database after OAuth authentication.
 * Uses service role key for bypass RLS restrictions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, avatarUrl, roleId, orgId } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createServiceRoleClient();

    // Get default student role if no role provided
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const { data: roles } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'STUDENT')
        .single();

      finalRoleId = roles?.id;
    }

    const { error } = await supabase.from('users').upsert({
      id: userId,
      email,
      display_name: fullName || email.split('@')[0],
      avatar_url: avatarUrl || null,
      role_id: finalRoleId, // Use the fetched role ID
      org_id: orgId || null,
    });

    if (error) {
      console.error('[Setup User Error]', error);
      return NextResponse.json(
        { error: `Failed to setup user: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Setup User Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
