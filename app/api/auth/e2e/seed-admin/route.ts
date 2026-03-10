import { createServiceRoleClient } from '@/shared/lib/supabase-server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@slu.edu.ph';
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Passw0rd!E2EAdmin';
const E2E_ADMIN_DISPLAY_NAME = process.env.E2E_ADMIN_DISPLAY_NAME || 'E2E Admin';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  try {
    const supabaseAdmin = createServiceRoleClient();

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'SUPER_ADMIN')
      .single();

    if (roleError || !roleData) {
      console.error('[E2E Seed] Failed to resolve SUPER_ADMIN role:', roleError);
      return NextResponse.json(
        { success: false, error: 'Missing SUPER_ADMIN role seed.' },
        { status: 500 }
      );
    }

    const { data: listedUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (listUsersError) {
      console.error('[E2E Seed] Failed to list auth users:', listUsersError);
      return NextResponse.json(
        { success: false, error: 'Failed to inspect auth users.' },
        { status: 500 }
      );
    }

    let authUser = listedUsers.users.find(
      (user) => user.email?.toLowerCase() === E2E_ADMIN_EMAIL.toLowerCase()
    );

    if (authUser) {
      const { data: updatedUser, error: updateUserError } =
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password: E2E_ADMIN_PASSWORD,
          user_metadata: {
            display_name: E2E_ADMIN_DISPLAY_NAME,
          },
        });

      if (updateUserError || !updatedUser.user) {
        console.error('[E2E Seed] Failed to update auth user:', updateUserError);
        return NextResponse.json(
          { success: false, error: 'Failed to refresh the E2E auth user.' },
          { status: 500 }
        );
      }

      authUser = updatedUser.user;
    } else {
      const { data: createdUser, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email: E2E_ADMIN_EMAIL,
          password: E2E_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            display_name: E2E_ADMIN_DISPLAY_NAME,
          },
        });

      if (createUserError || !createdUser.user) {
        console.error('[E2E Seed] Failed to create auth user:', createUserError);
        return NextResponse.json(
          { success: false, error: 'Failed to create the E2E auth user.' },
          { status: 500 }
        );
      }

      authUser = createdUser.user;
    }

    const { error: userRecordError } = await supabaseAdmin.from('users').upsert(
      {
        id: authUser.id,
        email: E2E_ADMIN_EMAIL,
        display_name: E2E_ADMIN_DISPLAY_NAME,
        role_id: roleData.id,
        avatar_url: null,
        org_id: null,
      },
      { onConflict: 'id' }
    );

    if (userRecordError) {
      console.error('[E2E Seed] Failed to upsert app user record:', userRecordError);
      return NextResponse.json(
        { success: false, error: 'Failed to sync the E2E app user record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credentials: {
        email: E2E_ADMIN_EMAIL,
        password: E2E_ADMIN_PASSWORD,
      },
      userId: authUser.id,
    });
  } catch (error) {
    console.error('[E2E Seed] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected E2E seeding error.' },
      { status: 500 }
    );
  }
}
