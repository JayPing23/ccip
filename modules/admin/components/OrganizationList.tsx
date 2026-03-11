'use client';

import ConfirmDialog from '@/shared/components/ConfirmDialog';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateOrganization } = useUpdateOrganization();
  const { deleteOrganization } = useDeleteOrganization();

  if (loading) {
    return <div className="text-brand-text-muted py-8 text-center">Loading organizations...</div>;
  }

  const handleDelete = async (orgId: string) => {
    setIsDeleting(true);
    try {
      await deleteOrganization(orgId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete organization:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
        <h2 className="text-brand-text-primary text-xl font-bold">Organizations</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-brand-primary hover:bg-brand-primary/80 rounded-md px-4 py-2 text-sm font-medium text-white"
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
      <div className="border-brand-secondary/20 bg-brand-surface rounded-lg border">
        {organizations.length === 0 ? (
          <div className="text-brand-text-muted py-8 text-center">No organizations found</div>
        ) : (
          <div className="divide-brand-secondary/20 divide-y">
            {organizations.map((org) => (
              <OrgRow
                key={org.id}
                org={org}
                organizations={organizations}
                isEditing={editingOrgId === org.id}
                onEdit={handleEdit}
                onDelete={(orgId, orgName) => setDeleteTarget({ id: orgId, name: orgName })}
                onEditCancel={() => setEditingOrgId(null)}
                onEditClick={() => setEditingOrgId(org.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Organization"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
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
      <div className="hover:bg-brand-bg flex items-center justify-between px-4 py-4">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              id="edit-org-name"
              aria-label="Organization name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border-brand-secondary/30 rounded-md border px-2 py-1"
              autoFocus
            />
          ) : (
            <div>
              <div className="text-brand-text-primary font-medium">{org.name}</div>
              <div className="text-brand-text-muted flex gap-4 text-sm">
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
                className="bg-status-success hover:bg-status-success/80 rounded-md px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-md border px-3 py-1 text-sm font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEditClick}
                className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-md border px-3 py-1 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(org.id, org.name)}
                className="border-status-error/30 text-status-error hover:bg-status-error/10 rounded-md border px-3 py-1 text-sm font-medium"
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
    <div className="border-brand-secondary/20 bg-brand-surface rounded-lg border p-6">
      <h3 className="text-brand-text-primary mb-4 text-lg font-bold">Create Organization</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="border-status-error/20 bg-status-error/10 rounded-lg border p-3">
            <p className="text-status-error text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="text-brand-text-secondary block text-sm font-medium">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            className="border-brand-secondary/30 mt-1 block w-full rounded-md border px-3 py-2"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="org-type" className="text-brand-text-secondary block text-sm font-medium">
            Type *
          </label>
          <select
            id="org-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as IOrganization['type']);
              setParentId(''); // Reset parent when type changes
            }}
            className="border-brand-secondary/30 mt-1 block w-full rounded-md border px-3 py-2"
            disabled={isSubmitting}
          >
            <option value="UNIVERSITY">University</option>
            <option value="SCHOOL">School</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </div>

        {type !== 'UNIVERSITY' && (
          <div>
            <label
              htmlFor="org-parent"
              className="text-brand-text-secondary block text-sm font-medium"
            >
              Parent Organization *
            </label>
            <select
              id="org-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="border-brand-secondary/30 mt-1 block w-full rounded-md border px-3 py-2"
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
            className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-md border px-4 py-2 text-sm font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-brand-primary hover:bg-brand-primary/80 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
