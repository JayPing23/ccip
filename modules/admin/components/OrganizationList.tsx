'use client';

import type { IOrganization } from '@/shared/types/database.types';
import { useState } from 'react';
import { useDeleteOrganization, useUpdateOrganization } from '../hooks/index';

interface OrganizationListProps {
  organizations: IOrganization[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Organization Management Component
 * Displays organizations in a list/tree view with CRUD operations
 */
export default function OrganizationList({
  organizations,
  loading,
  onRefresh,
}: OrganizationListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const { updateOrganization } = useUpdateOrganization();
  const { deleteOrganization } = useDeleteOrganization();

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading organizations...</div>;
  }

  const handleDelete = async (orgId: string, orgName: string) => {
    if (confirm(`Are you sure you want to delete "${orgName}"? This cannot be undone.`)) {
      try {
        await deleteOrganization(orgId);
        onRefresh();
      } catch (err) {
        console.error('Failed to delete organization:', err);
      }
    }
  };

  const handleEdit = async (orgId: string, newName: string) => {
    try {
      await updateOrganization(orgId, { name: newName });
      setEditingOrgId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update organization:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-between">
        <h2 className="text-xl font-bold text-gray-900">Organizations</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Organization'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateOrganizationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            onRefresh();
          }}
          parentOrganizations={organizations}
        />
      )}

      {/* Organizations Tree */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {organizations.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No organizations found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {organizations.map((org) => (
              <OrgRow
                key={org.id}
                org={org}
                organizations={organizations}
                isEditing={editingOrgId === org.id}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onEditCancel={() => setEditingOrgId(null)}
                onEditClick={() => setEditingOrgId(org.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrgRowProps {
  org: IOrganization;
  organizations: IOrganization[];
  isEditing: boolean;
  onEdit: (orgId: string, newName: string) => Promise<void>;
  onDelete: (orgId: string, orgName: string) => void;
  onEditCancel: () => void;
  onEditClick: () => void;
}

/**
 * Organization Row Component
 */
function OrgRow({
  org,
  organizations,
  isEditing,
  onEdit,
  onDelete,
  onEditCancel,
  onEditClick,
}: OrgRowProps) {
  const [editName, setEditName] = useState(org.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOrg = org.parent_id ? organizations.find((o) => o.id === org.parent_id) : null;

  const childOrgs = organizations.filter((o) => o.parent_id === org.id);

  const handleSubmit = async () => {
    if (editName.trim()) {
      setIsSubmitting(true);
      try {
        await onEdit(org.id, editName);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 hover:bg-gray-50">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              id="edit-org-name"
              aria-label="Organization name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1"
              autoFocus
            />
          ) : (
            <div>
              <div className="font-medium text-gray-900">{org.name}</div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Type: {org.type}</span>
                {parentOrg && <span>Parent: {parentOrg.name}</span>}
                {childOrgs.length > 0 && <span>Children: {childOrgs.length}</span>}
                <span>Users: —</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEditClick}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(org.id, org.name)}
                className="rounded-md border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

interface CreateOrganizationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  parentOrganizations: IOrganization[];
}

/**
 * Create Organization Form
 */
function CreateOrganizationForm({
  onClose,
  onSuccess,
  parentOrganizations,
}: CreateOrganizationFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT'>('SCHOOL');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          parent_id: parentId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create organization');
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter parent options based on selected type
  let parentOptions = parentOrganizations;
  if (type === 'SCHOOL') {
    parentOptions = parentOrganizations.filter((o) => o.type === 'UNIVERSITY');
  } else if (type === 'DEPARTMENT') {
    parentOptions = parentOrganizations.filter((o) => o.type === 'SCHOOL');
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Create Organization</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="org-type" className="block text-sm font-medium text-gray-700">
            Type *
          </label>
          <select
            id="org-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as IOrganization['type']);
              setParentId(''); // Reset parent when type changes
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            disabled={isSubmitting}
          >
            <option value="UNIVERSITY">University</option>
            <option value="SCHOOL">School</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </div>

        {type !== 'UNIVERSITY' && (
          <div>
            <label htmlFor="org-parent" className="block text-sm font-medium text-gray-700">
              Parent Organization *
            </label>
            <select
              id="org-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isSubmitting}
            >
              <option value="">Select parent...</option>
              {parentOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
