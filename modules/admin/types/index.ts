/**
 * Admin Types
 * Types specific to admin functionality
 */

import type { IOrganization } from '@/shared/types/database.types';

export interface UserWithRole {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role_id: string;
  role_name?: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN';
  org_id: string | null;
  org_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalContent: number;
  totalOrganizations: number;
  recentActivityCount: number;
}

export interface AdminPageProps {
  children?: React.ReactNode;
}

export interface UserListResponse {
  success: boolean;
  data: UserWithRole[];
  error?: {
    code: string;
    message: string;
  };
}

export interface OrganizationTreeNode extends IOrganization {
  children?: OrganizationTreeNode[];
  memberCount?: number;
}
