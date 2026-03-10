/**
 * E2E Test: Admin Analytics & Dashboard
 *
 * Covers:
 *   - Admin dashboard structure and stats
 *   - Quick actions navigation
 *   - User management (list, filter, edit)
 *   - Organization management (list, create, edit, delete)
 *   - Roles display
 *   - Admin sidebar navigation
 */

describe('Admin Console', () => {
  // -----------------------------------------------------------------------
  // Admin Dashboard
  // -----------------------------------------------------------------------

  describe('Dashboard', () => {
    it('displays the Dashboard heading and welcome message', () => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
      cy.contains('h2', 'Dashboard').should('be.visible');
      cy.contains('Welcome back').should('be.visible');
    });

    it('displays stats grid with cards', () => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/admin/stats', {
        statusCode: 200,
        body: {
          data: { totalUsers: 150, publishedContent: 42, totalOrganizations: 8 },
          error: null,
        },
      }).as('getStats');

      cy.visit('/admin/dashboard');
      cy.wait('@getStats');
      cy.contains('Total Users').should('be.visible');
      cy.contains('150').should('be.visible');
      cy.contains('Published Content').should('be.visible');
      cy.contains('42').should('be.visible');
      cy.contains('Organizations').should('be.visible');
      cy.contains('8').should('be.visible');
    });

    it('shows loading placeholders for stats', () => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/admin/stats', (req) => {
        req.on('response', (res) => res.setDelay(3000));
      }).as('getStatsDelay');

      cy.visit('/admin/dashboard');
      cy.contains('...').should('be.visible');
    });

    it('displays the Recent Activity section', () => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
      cy.contains('h3', 'Recent Activity').should('be.visible');
    });

    it('displays Quick Actions links', () => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
      cy.contains('h3', 'Quick Actions').should('be.visible');
      cy.contains('a', 'Users').should('have.attr', 'href', '/admin/users');
      cy.contains('a', 'Organizations').should('have.attr', 'href', '/admin/organizations');
      cy.contains('a', 'Roles').should('have.attr', 'href', '/admin/roles');
    });
  });

  // -----------------------------------------------------------------------
  // Sidebar Navigation
  // -----------------------------------------------------------------------

  describe('Sidebar Navigation', () => {
    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
    });

    it('has all sidebar navigation links', () => {
      cy.contains('a', 'Dashboard').should('be.visible');
      cy.contains('a', 'Users').should('be.visible');
      cy.contains('a', 'Organizations').should('be.visible');
      cy.contains('a', 'Roles').should('be.visible');
      cy.contains('a', 'Content').should('be.visible');
      cy.contains('a', 'Moderation').should('be.visible');
      cy.contains('a', 'Retention').should('be.visible');
    });

    it('navigates to Users page', () => {
      cy.contains('a', 'Users').click();
      cy.location('pathname').should('eq', '/admin/users');
      cy.contains('User Management').should('be.visible');
    });

    it('navigates to Organizations page', () => {
      cy.contains('a', 'Organizations').click();
      cy.location('pathname').should('eq', '/admin/organizations');
      cy.contains('h2', 'Organizations').should('be.visible');
    });

    it('navigates to Roles page', () => {
      cy.contains('a', 'Roles').click();
      cy.location('pathname').should('eq', '/admin/roles');
      cy.contains('Roles & Permissions').should('be.visible');
    });

    it('has a Portal Dashboard back link', () => {
      cy.contains('Portal Dashboard').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // User Management
  // -----------------------------------------------------------------------

  describe('User Management', () => {
    const mockUsers = [
      {
        id: 'u-1',
        display_name: 'John Student',
        email: 'john@slu.edu.ph',
        role_id: 'role-s',
        role_name: 'STUDENT',
        org_id: null,
        created_at: '2026-01-15T00:00:00Z',
      },
      {
        id: 'u-2',
        display_name: 'Jane Editor',
        email: 'jane@slu.edu.ph',
        role_id: 'role-e',
        role_name: 'DEPT_EDITOR',
        org_id: 'org-1',
        created_at: '2026-02-01T00:00:00Z',
      },
    ];

    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/users*', {
        statusCode: 200,
        body: { data: mockUsers, error: null },
      }).as('getUsers');
    });

    it('displays the User Management heading', () => {
      cy.visit('/admin/users');
      cy.contains('User Management').should('be.visible');
    });

    it('shows loading spinner initially', () => {
      cy.intercept('GET', '/api/users*', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getUsersDelay');

      cy.visit('/admin/users');
      cy.contains('Loading users').should('be.visible');
    });

    it('renders users in a table', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.contains('John Student').should('be.visible');
      cy.contains('jane@slu.edu.ph').should('be.visible');
    });

    it('has search input', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.get('input[placeholder="Name or email..."]').should('be.visible');
    });

    it('filters users by search text', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.get('input[placeholder="Name or email..."]').type('jane');
      cy.contains('Jane Editor').should('be.visible');
    });

    it('filters by role', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.get('#filter-role').select('Student');
    });

    it('sorts users', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.get('#sort-by').select('Email');
    });

    it('shows user count', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.contains('2 users').should('be.visible');
    });

    it('opens edit modal when clicking Edit', () => {
      cy.intercept('GET', '/api/roles', {
        statusCode: 200,
        body: { data: [{ id: 'role-s', name: 'STUDENT' }], error: null },
      }).as('getRoles');
      cy.intercept('GET', '/api/organizations', {
        statusCode: 200,
        body: { data: [], error: null },
      }).as('getOrgs');

      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.contains('td', 'John Student').parent('tr').contains('button', 'Edit').click();
      cy.contains('h3', 'Edit User').should('be.visible');
      cy.get('#edit-name').should('have.value', 'John Student');
      cy.get('#edit-email').should('have.value', 'john@slu.edu.ph');
    });

    it('closes edit modal on Cancel', () => {
      cy.intercept('GET', '/api/roles', {
        statusCode: 200,
        body: { data: [{ id: 'role-s', name: 'STUDENT' }], error: null },
      }).as('getRoles');
      cy.intercept('GET', '/api/organizations', {
        statusCode: 200,
        body: { data: [], error: null },
      }).as('getOrgs');

      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.contains('td', 'John Student').parent('tr').contains('button', 'Edit').click();
      cy.contains('button', 'Cancel').click();
      cy.contains('h3', 'Edit User').should('not.exist');
    });

    it('shows empty state when no users match filter', () => {
      cy.visit('/admin/users');
      cy.wait('@getUsers');
      cy.get('input[placeholder="Name or email..."]').type('nonexistentuser');
      cy.contains('No users match your filter').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Organization Management
  // -----------------------------------------------------------------------

  describe('Organization Management', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Saint Louis University',
        slug: 'slu',
        type: 'UNIVERSITY',
        parent_id: null,
        children: [],
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'org-2',
        name: 'School of AMCIS',
        slug: 'samcis',
        type: 'SCHOOL',
        parent_id: 'org-1',
        children: [],
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/organizations*', {
        statusCode: 200,
        body: { data: mockOrgs, error: null },
      }).as('getOrgs');
    });

    it('displays the Organizations heading', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('h2', 'Organizations').should('be.visible');
    });

    it('renders organization rows', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('Saint Louis University').should('be.visible');
      cy.contains('School of AMCIS').should('be.visible');
    });

    it('shows type for each org', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('UNIVERSITY').should('be.visible');
      cy.contains('SCHOOL').should('be.visible');
    });

    it('has Edit and Delete buttons per org', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('button', 'Edit').should('be.visible');
      cy.contains('button', 'Delete').should('be.visible');
    });

    it('shows create organization form when clicking + Create Organization', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('button', 'Create Organization').click();
      cy.contains('h3', 'Create Organization').should('be.visible');
      cy.get('#org-type').should('be.visible');
    });

    it('creates a new organization', () => {
      cy.intercept('POST', '/api/organizations', {
        statusCode: 201,
        body: {
          data: { id: 'org-new', name: 'New School', slug: 'new-school', type: 'SCHOOL' },
          error: null,
        },
      }).as('createOrg');

      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('button', 'Create Organization').click();

      cy.get('input[placeholder="Organization name"]').type('New School');
      cy.get('#org-type').select('School');
      cy.get('#org-parent').select('Saint Louis University');
      cy.contains('button[type="submit"]', 'Create Organization').click();

      cy.wait('@createOrg');
    });

    it('validates organization name is required', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('button', 'Create Organization').click();
      cy.contains('button[type="submit"]', 'Create Organization').click();
      cy.contains('Organization name is required').should('be.visible');
    });

    it('cancels create form', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('button', 'Create Organization').click();
      cy.contains('h3', 'Create Organization').should('be.visible');
      cy.contains('button', 'Cancel').click();
      cy.contains('h3', 'Create Organization').should('not.exist');
    });

    it('enters inline edit mode for org name', () => {
      cy.visit('/admin/organizations');
      cy.wait('@getOrgs');
      cy.contains('Saint Louis University')
        .closest('.flex.items-center')
        .find('button')
        .filter(':contains("Edit")')
        .click();
      cy.get('#edit-org-name').should('be.visible');
      cy.contains('button', 'Save').should('be.visible');
    });

    it('shows loading state', () => {
      cy.intercept('GET', '/api/organizations*', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getOrgsDelay');

      cy.visit('/admin/organizations');
      cy.contains('Loading organizations').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Roles Page
  // -----------------------------------------------------------------------

  describe('Roles Page', () => {
    const mockRoles = [
      { id: 'r-1', name: 'STUDENT', created_at: '2026-01-01T00:00:00Z' },
      { id: 'r-2', name: 'DEPT_EDITOR', created_at: '2026-01-01T00:00:00Z' },
      { id: 'r-3', name: 'UNIVERSITY_EDITOR', created_at: '2026-01-01T00:00:00Z' },
      { id: 'r-4', name: 'SUPER_ADMIN', created_at: '2026-01-01T00:00:00Z' },
    ];

    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/roles', {
        statusCode: 200,
        body: { data: mockRoles, error: null },
      }).as('getRoles');
      cy.intercept('GET', '/api/users*', {
        statusCode: 200,
        body: { data: [], error: null },
      }).as('getUsers');
    });

    it('displays the Roles & Permissions heading', () => {
      cy.visit('/admin/roles');
      cy.contains('Roles & Permissions').should('be.visible');
    });

    it('renders all four roles', () => {
      cy.visit('/admin/roles');
      cy.wait('@getRoles');
      cy.contains('STUDENT').should('be.visible');
      cy.contains('DEPT EDITOR').should('be.visible');
      cy.contains('UNIVERSITY EDITOR').should('be.visible');
      cy.contains('SUPER ADMIN').should('be.visible');
    });

    it('shows role descriptions', () => {
      cy.visit('/admin/roles');
      cy.wait('@getRoles');
      cy.contains('Read-only access to published content').should('be.visible');
      cy.contains('Full system access').should('be.visible');
    });

    it('shows loading state', () => {
      cy.intercept('GET', '/api/roles', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getRolesDelay');

      cy.visit('/admin/roles');
      cy.contains('Loading roles').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.intercept('GET', '/api/roles', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error' } },
      }).as('getRolesErr');

      cy.visit('/admin/roles');
      cy.wait('@getRolesErr');
    });
  });

  // -----------------------------------------------------------------------
  // Admin Content Oversight
  // -----------------------------------------------------------------------

  describe('Admin Content', () => {
    it('navigates to Admin Content page', () => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
      cy.contains('a', 'Content').click();
      cy.location('pathname').should('eq', '/admin/content');
      cy.contains('Announcement Oversight').should('be.visible');
    });
  });
});
