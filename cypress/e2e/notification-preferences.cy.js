/**
 * E2E Test: Notification Preferences
 *
 * Covers:
 *   - Loading state
 *   - Per-org preference rows (in-app, email, digest)
 *   - Saving preference changes
 *   - Error state
 *   - Empty state (no orgs)
 */

describe('Notification Preferences', () => {
  const mockOrgs = [
    { id: 'org-1', name: 'School of AMCIS', type: 'SCHOOL', slug: 'samcis' },
    { id: 'org-2', name: 'Information Technology', type: 'DEPARTMENT', slug: 'it' },
  ];

  const mockPreferences = [
    {
      user_id: 'user-1',
      org_id: 'org-1',
      in_app_enabled: true,
      email_enabled: true,
      email_digest: 'DAILY',
    },
    {
      user_id: 'user-1',
      org_id: 'org-2',
      in_app_enabled: true,
      email_enabled: false,
      email_digest: 'NONE',
    },
  ];

  // -----------------------------------------------------------------------
  // Dashboard Integration
  // -----------------------------------------------------------------------

  describe('Dashboard Integration', () => {
    it('shows Notification Preferences section on the dashboard', () => {
      cy.loginAsSeededEditor();
      cy.visit('/dashboard');
      cy.contains('Notification Preferences').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Loading State
  // -----------------------------------------------------------------------

  describe('Loading State', () => {
    it('shows loading text while fetching preferences', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/notifications/preferences', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getPrefsDelayed');

      cy.visit('/dashboard');
      cy.contains('Loading preferences').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Preference Display
  // -----------------------------------------------------------------------

  describe('Preference Display', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/organizations', {
        statusCode: 200,
        body: { data: mockOrgs },
      }).as('getOrgs');
      cy.intercept('GET', '/api/notifications/preferences', {
        statusCode: 200,
        body: { data: mockPreferences },
      }).as('getPrefs');
    });

    it('displays organization names', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      cy.contains('School of AMCIS').should('be.visible');
      cy.contains('Information Technology').should('be.visible');
    });

    it('displays org type labels', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      cy.contains('school').should('be.visible');
      cy.contains('department').should('be.visible');
    });

    it('displays In-app and Email checkboxes per org', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      cy.contains('In-app').should('be.visible');
      cy.contains('Email').should('be.visible');
    });

    it('shows digest frequency select', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      cy.get('select')
        .filter(':has(option:contains("Daily digest"))')
        .should('have.length.at.least', 1);
    });

    it('disables digest select when email is unchecked', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      // The second org has email disabled — its digest select should be disabled
      cy.contains('Information Technology')
        .closest('div')
        .parent()
        .find('select')
        .should('be.disabled');
    });
  });

  // -----------------------------------------------------------------------
  // Saving Preferences
  // -----------------------------------------------------------------------

  describe('Saving Preferences', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/organizations', {
        statusCode: 200,
        body: { data: mockOrgs },
      }).as('getOrgs');
      cy.intercept('GET', '/api/notifications/preferences', {
        statusCode: 200,
        body: { data: mockPreferences },
      }).as('getPrefs');
    });

    it('shows Save button per org row', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      cy.contains('button', 'Save').should('be.visible');
    });

    it('Save button is disabled until a change is made', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');
      // Find the first Save button — should be disabled initially
      cy.contains('School of AMCIS')
        .closest('div')
        .parent()
        .find('button')
        .filter(':contains("Save")')
        .should('be.disabled');
    });

    it('enables Save button after toggling a checkbox', () => {
      cy.visit('/dashboard');
      cy.wait('@getPrefs');

      // Toggle the In-app checkbox for first org
      cy.contains('School of AMCIS')
        .closest('div')
        .parent()
        .contains('label', 'In-app')
        .find('input[type="checkbox"]')
        .click();

      cy.contains('School of AMCIS')
        .closest('div')
        .parent()
        .find('button')
        .filter(':contains("Save")')
        .should('not.be.disabled');
    });

    it('saves preference changes', () => {
      cy.intercept('PUT', '/api/notifications/preferences', {
        statusCode: 200,
        body: { data: { success: true }, error: null },
      }).as('savePrefs');

      cy.visit('/dashboard');
      cy.wait('@getPrefs');

      // Toggle a checkbox then save
      cy.contains('School of AMCIS')
        .closest('div')
        .parent()
        .contains('label', 'In-app')
        .find('input[type="checkbox"]')
        .click();

      cy.contains('School of AMCIS')
        .closest('div')
        .parent()
        .find('button')
        .filter(':contains("Save")')
        .click();
    });
  });

  // -----------------------------------------------------------------------
  // Empty / Error States
  // -----------------------------------------------------------------------

  describe('Empty and Error States', () => {
    it('shows empty state when no organizations available', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/organizations', {
        statusCode: 200,
        body: { data: [] },
      }).as('getOrgsEmpty');
      cy.intercept('GET', '/api/notifications/preferences', {
        statusCode: 200,
        body: { data: [] },
      }).as('getPrefsEmpty');

      cy.visit('/dashboard');
      cy.wait('@getPrefsEmpty');
      cy.contains('No organizations available').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/notifications/preferences', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error' } },
      }).as('getPrefsErr');

      cy.visit('/dashboard');
      cy.wait('@getPrefsErr');
    });
  });
});
