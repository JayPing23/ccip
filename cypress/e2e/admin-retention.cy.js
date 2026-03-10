/**
 * E2E Test: Admin Retention Page
 *
 * Covers:
 *   - Page loading states (loading spinner, error display)
 *   - Retention policies table rendering
 *   - Editing a policy (inline form, save, cancel)
 *   - Stale content summary cards
 *   - Retention candidates table rendering
 *   - Archive buttons per content type
 *   - Archiving stale content
 *   - Empty state when no candidates
 *   - Error handling on API failure
 *   - Navigation from admin sidebar
 */

describe('Admin Retention Page', () => {
  beforeEach(() => {
    cy.loginAsSeededAdmin();
  });

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  describe('Navigation', () => {
    it('can navigate to the retention page from the admin sidebar', () => {
      cy.visit('/admin/dashboard');
      cy.contains('a', 'Retention').click();
      cy.location('pathname').should('eq', '/admin/retention');
      cy.contains('Content Lifecycle & Retention').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Page Structure & Content
  // -----------------------------------------------------------------------

  describe('Page Structure', () => {
    it('displays the page title and description', () => {
      cy.visit('/admin/retention');
      cy.contains('h2', 'Content Lifecycle & Retention').should('be.visible');
      cy.contains('Manage retention policies and review stale content across all pillars.').should(
        'be.visible'
      );
    });

    it('displays the Retention Policies section heading', () => {
      cy.visit('/admin/retention');
      cy.contains('h3', 'Retention Policies').should('be.visible');
    });

    it('displays the Stale Content Summary section heading', () => {
      cy.visit('/admin/retention');
      cy.contains('h3', 'Stale Content Summary').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Loading State
  // -----------------------------------------------------------------------

  describe('Loading State', () => {
    it('displays a loading indicator while fetching data', () => {
      cy.intercept('GET', '/api/admin/retention', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      }).as('getRetentionDelayed');

      cy.visit('/admin/retention');
      cy.contains('Loading retention data...').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Error State
  // -----------------------------------------------------------------------

  describe('Error State', () => {
    it('displays an error message when the API returns an error', () => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error', code: 'INTERNAL_SERVER_ERROR' } },
      }).as('getRetentionError');

      cy.visit('/admin/retention');
      cy.wait('@getRetentionError');
      cy.contains('Failed to load retention data').should('be.visible');
    });

    it('displays an error when the network is down', () => {
      cy.intercept('GET', '/api/admin/retention', { forceNetworkError: true }).as(
        'getRetentionNetError'
      );

      cy.visit('/admin/retention');
      cy.wait('@getRetentionNetError');
      cy.get('.bg-red-50').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Retention Policies Table
  // -----------------------------------------------------------------------

  describe('Retention Policies Table', () => {
    const mockPolicies = [
      {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'policy-art',
        content_type: 'ARTICLE',
        stale_after_days: 365,
        auto_archive_after_days: null,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'policy-thr',
        content_type: 'THREAD',
        stale_after_days: 180,
        auto_archive_after_days: null,
        enabled: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockCandidates = {
      totalStale: 0,
      totalArchivable: 0,
      candidates: [],
    };

    beforeEach(() => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: mockPolicies, candidates: mockCandidates },
          error: null,
        },
      }).as('getRetention');
    });

    it('renders the policies table with correct headers', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('th', 'Content Type').should('be.visible');
      cy.contains('th', 'Stale After (days)').should('be.visible');
      cy.contains('th', 'Auto-Archive After (days)').should('be.visible');
      cy.contains('th', 'Enabled').should('be.visible');
      cy.contains('th', 'Actions').should('be.visible');
    });

    it('renders all three policy rows', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', 'ANNOUNCEMENT').should('be.visible');
      cy.contains('td', 'ARTICLE').should('be.visible');
      cy.contains('td', 'THREAD').should('be.visible');
    });

    it('displays stale_after_days for each policy', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', '90').should('be.visible');
      cy.contains('td', '365').should('be.visible');
      cy.contains('td', '180').should('be.visible');
    });

    it('displays auto_archive_after_days or em dash when null', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // ANNOUNCEMENT has 180
      cy.contains('td', '180').should('be.visible');
      // ARTICLE and THREAD have null → "—"
      cy.get('td').filter(':contains("—")').should('have.length.at.least', 2);
    });

    it('displays enabled status badges correctly', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.get('span').filter(':contains("Active")').should('have.length.at.least', 2);
      cy.get('span').filter(':contains("Disabled")').should('have.length.at.least', 1);
    });

    it('displays an Edit button for each policy', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.get('button').filter(':contains("Edit")').should('have.length', 3);
    });
  });

  // -----------------------------------------------------------------------
  // Policy Editing
  // -----------------------------------------------------------------------

  describe('Policy Editing', () => {
    const mockPolicies = [
      {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockCandidates = {
      totalStale: 0,
      totalArchivable: 0,
      candidates: [],
    };

    beforeEach(() => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: mockPolicies, candidates: mockCandidates },
          error: null,
        },
      }).as('getRetention');
    });

    it('clicking Edit shows inline form inputs and Save/Cancel buttons', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Edit').click();

      // Number inputs for stale_after_days and auto_archive_after_days
      cy.get('input[type="number"]').should('have.length', 2);
      // Checkbox for enabled
      cy.get('input[type="checkbox"]').should('have.length', 1);
      // Save and Cancel buttons
      cy.contains('button', 'Save').should('be.visible');
      cy.contains('button', 'Cancel').should('be.visible');
    });

    it('pre-populates the form with the current policy values', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Edit').click();

      cy.get('input[type="number"]').first().should('have.value', '90');
      cy.get('input[type="number"]').last().should('have.value', '180');
      cy.get('input[type="checkbox"]').should('be.checked');
    });

    it('clicking Cancel exits edit mode without saving', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="number"]').first().type('{selectall}120');
      cy.contains('button', 'Cancel').click();

      // Should be back to read mode with original value
      cy.contains('td', '90').should('be.visible');
      cy.contains('button', 'Edit').should('be.visible');
      cy.contains('button', 'Save').should('not.exist');
    });

    it('changing stale_after_days and saving calls PATCH', () => {
      const updatedPolicy = {
        ...mockPolicies[0],
        stale_after_days: 120,
        updated_at: '2026-03-10T00:00:00Z',
      };

      cy.intercept('PATCH', '/api/admin/retention', {
        statusCode: 200,
        body: { data: updatedPolicy, error: null },
      }).as('patchPolicy');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // Register refresh intercept AFTER initial load so LIFO doesn't steal the first GET
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: [updatedPolicy],
            candidates: mockCandidates,
          },
          error: null,
        },
      }).as('getRetentionRefresh');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="number"]').first().type('{selectall}120');
      cy.contains('button', 'Save').click();

      cy.wait('@patchPolicy').its('request.body').should('deep.include', {
        id: 'policy-ann',
        stale_after_days: 120,
      });

      cy.wait('@getRetentionRefresh');
      cy.contains('td', '120').should('be.visible');
    });

    it('changing auto_archive_after_days to empty sets null', () => {
      cy.intercept('PATCH', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { ...mockPolicies[0], auto_archive_after_days: null },
          error: null,
        },
      }).as('patchPolicy');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: [{ ...mockPolicies[0], auto_archive_after_days: null }],
            candidates: mockCandidates,
          },
          error: null,
        },
      }).as('getRetentionRefresh');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="number"]').last().type('{selectall}{backspace}');
      cy.contains('button', 'Save').click();

      cy.wait('@patchPolicy').its('request.body').should('deep.include', {
        id: 'policy-ann',
        auto_archive_after_days: null,
      });
    });

    it('toggling the enabled checkbox updates the value', () => {
      cy.intercept('PATCH', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { ...mockPolicies[0], enabled: false },
          error: null,
        },
      }).as('patchPolicy');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: [{ ...mockPolicies[0], enabled: false }],
            candidates: mockCandidates,
          },
          error: null,
        },
      }).as('getRetentionRefresh');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="checkbox"]').uncheck();
      cy.contains('button', 'Save').click();

      cy.wait('@patchPolicy').its('request.body').should('deep.include', {
        id: 'policy-ann',
        enabled: false,
      });

      cy.wait('@getRetentionRefresh');
      cy.contains('span', 'Disabled').should('be.visible');
    });

    it('displays an error when PATCH fails', () => {
      cy.intercept('PATCH', '/api/admin/retention', {
        statusCode: 500,
        body: { data: null, error: { message: 'Update failed', code: 'INTERNAL_SERVER_ERROR' } },
      }).as('patchPolicyFail');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="number"]').first().type('{selectall}120');
      cy.contains('button', 'Save').click();

      cy.wait('@patchPolicyFail');
      cy.contains('Failed to update policy').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Stale Content Summary Cards
  // -----------------------------------------------------------------------

  describe('Stale Content Summary', () => {
    const mockPolicies = [
      {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    it('displays correct counts for stale and archivable content', () => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: mockPolicies,
            candidates: {
              totalStale: 5,
              totalArchivable: 3,
              candidates: [],
            },
          },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('p', '5').should('be.visible');
      cy.contains('Flagged as stale').should('be.visible');
      cy.contains('p', '3').should('be.visible');
      cy.contains('Ready for auto-archive').should('be.visible');
    });

    it('displays zero when there are no stale or archivable items', () => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: mockPolicies,
            candidates: {
              totalStale: 0,
              totalArchivable: 0,
              candidates: [],
            },
          },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.get('.bg-yellow-50').within(() => {
        cy.contains('0').should('be.visible');
      });
      cy.get('.bg-red-50')
        .first()
        .within(() => {
          cy.contains('0').should('be.visible');
        });
    });
  });

  // -----------------------------------------------------------------------
  // Retention Candidates Table
  // -----------------------------------------------------------------------

  describe('Retention Candidates Table', () => {
    const mockPolicies = [
      {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockCandidates = {
      totalStale: 2,
      totalArchivable: 1,
      candidates: [
        {
          id: 'c1',
          content_type: 'ANNOUNCEMENT',
          title: 'Old Campus Announcement',
          status: 'PUBLISHED',
          last_activity_at: '2025-06-01T00:00:00Z',
          age_days: 280,
          recommended_action: 'ARCHIVE',
        },
        {
          id: 'c2',
          content_type: 'ARTICLE',
          title: 'Outdated Research Article',
          status: 'PUBLISHED',
          last_activity_at: '2025-09-01T00:00:00Z',
          age_days: 190,
          recommended_action: 'FLAG_STALE',
        },
        {
          id: 'c3',
          content_type: 'THREAD',
          title: 'Old Forum Thread',
          status: 'OPEN',
          last_activity_at: '2025-03-01T00:00:00Z',
          age_days: 375,
          recommended_action: 'ARCHIVE',
        },
      ],
    };

    beforeEach(() => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: mockPolicies, candidates: mockCandidates },
          error: null,
        },
      }).as('getRetention');
    });

    it('displays the Retention Candidates heading', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');
      cy.contains('h3', 'Retention Candidates').should('be.visible');
    });

    it('renders the candidates table with correct headers', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('th', 'Title').should('be.visible');
      cy.contains('th', 'Type').should('be.visible');
      cy.contains('th', 'Status').should('be.visible');
      cy.contains('th', 'Age (days)').should('be.visible');
      cy.contains('th', 'Action').should('be.visible');
    });

    it('renders all candidate rows', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', 'Old Campus Announcement').should('be.visible');
      cy.contains('td', 'Outdated Research Article').should('be.visible');
      cy.contains('td', 'Old Forum Thread').should('be.visible');
    });

    it('displays content type for each candidate', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', 'ANNOUNCEMENT').should('be.visible');
      cy.contains('td', 'ARTICLE').should('be.visible');
      cy.contains('td', 'THREAD').should('be.visible');
    });

    it('displays status for each candidate', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', 'PUBLISHED').should('be.visible');
      cy.contains('td', 'OPEN').should('be.visible');
    });

    it('displays age in days for each candidate', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('td', '280').should('be.visible');
      cy.contains('td', '190').should('be.visible');
      cy.contains('td', '375').should('be.visible');
    });

    it('shows ARCHIVE badge in red for archivable candidates', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('span', 'ARCHIVE').should('have.class', 'bg-red-100');
    });

    it('shows FLAG_STALE badge in yellow for stale candidates', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('span', 'FLAG_STALE').should('have.class', 'bg-yellow-100');
    });
  });

  // -----------------------------------------------------------------------
  // Archive Buttons
  // -----------------------------------------------------------------------

  describe('Archive Buttons', () => {
    const mockPolicies = [
      {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockCandidates = {
      totalStale: 1,
      totalArchivable: 2,
      candidates: [
        {
          id: 'c1',
          content_type: 'ANNOUNCEMENT',
          title: 'Old Announcement',
          status: 'PUBLISHED',
          last_activity_at: '2025-06-01T00:00:00Z',
          age_days: 280,
          recommended_action: 'ARCHIVE',
        },
        {
          id: 'c2',
          content_type: 'ARTICLE',
          title: 'Stale Article (not archivable)',
          status: 'PUBLISHED',
          last_activity_at: '2025-09-01T00:00:00Z',
          age_days: 190,
          recommended_action: 'FLAG_STALE',
        },
        {
          id: 'c3',
          content_type: 'THREAD',
          title: 'Old Thread',
          status: 'OPEN',
          last_activity_at: '2025-03-01T00:00:00Z',
          age_days: 375,
          recommended_action: 'ARCHIVE',
        },
      ],
    };

    beforeEach(() => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: mockPolicies, candidates: mockCandidates },
          error: null,
        },
      }).as('getRetention');
    });

    it('shows archive buttons only for content types with archivable candidates', () => {
      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // ANNOUNCEMENT has 1 archivable, THREAD has 1 archivable
      cy.contains('button', 'Archive 1 announcements').should('be.visible');
      cy.contains('button', 'Archive 1 threads').should('be.visible');
      // ARTICLE has 0 archivable → no button
      cy.contains('button', /Archive.*article/i).should('not.exist');
    });

    it('clicking archive button sends POST with correct content_type and ids', () => {
      cy.intercept('POST', '/api/admin/retention', {
        statusCode: 200,
        body: { data: { archived: 1 }, error: null },
      }).as('postArchive');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // Register refresh intercept AFTER initial load
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: mockPolicies,
            candidates: {
              totalStale: 1,
              totalArchivable: 1,
              candidates: [mockCandidates.candidates[1], mockCandidates.candidates[2]],
            },
          },
          error: null,
        },
      }).as('getRetentionRefresh');

      cy.contains('button', 'Archive 1 announcements').click();

      cy.wait('@postArchive')
        .its('request.body')
        .should('deep.equal', {
          content_type: 'ANNOUNCEMENT',
          ids: ['c1'],
        });
    });

    it('disables archive buttons while archiving is in progress', () => {
      cy.intercept('POST', '/api/admin/retention', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
        req.reply({
          statusCode: 200,
          body: { data: { archived: 1 }, error: null },
        });
      }).as('postArchiveSlow');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Archive 1 announcements').click();

      // Both archive buttons should be disabled during the request
      cy.get('button:contains("Archive")').each(($btn) => {
        cy.wrap($btn).should('be.disabled');
      });
    });

    it('displays an error when archive POST fails', () => {
      cy.intercept('POST', '/api/admin/retention', {
        statusCode: 500,
        body: { data: null, error: { message: 'Archive failed', code: 'INTERNAL_SERVER_ERROR' } },
      }).as('postArchiveFail');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('button', 'Archive 1 announcements').click();
      cy.wait('@postArchiveFail');

      cy.contains('Failed to archive content').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Empty State
  // -----------------------------------------------------------------------

  describe('Empty State', () => {
    it('displays a success message when no candidates exist', () => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: [
              {
                id: 'policy-ann',
                content_type: 'ANNOUNCEMENT',
                stale_after_days: 90,
                auto_archive_after_days: 180,
                enabled: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
              },
            ],
            candidates: {
              totalStale: 0,
              totalArchivable: 0,
              candidates: [],
            },
          },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('No stale content detected').should('be.visible');
      cy.contains('All content is within retention thresholds').should('be.visible');
      cy.get('.bg-green-50').should('be.visible');
    });

    it('does not display retention candidates table when empty', () => {
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: [],
            candidates: {
              totalStale: 0,
              totalArchivable: 0,
              candidates: [],
            },
          },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      cy.contains('h3', 'Retention Candidates').should('not.exist');
    });
  });

  // -----------------------------------------------------------------------
  // Full Workflow: Edit Policy → View Candidates → Archive
  // -----------------------------------------------------------------------

  describe('Full Workflow', () => {
    it('edits a policy, views updated candidates, and archives stale content', () => {
      const initialPolicy = {
        id: 'policy-ann',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 90,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const candidatesWithArchivable = {
        totalStale: 1,
        totalArchivable: 1,
        candidates: [
          {
            id: 'c1',
            content_type: 'ANNOUNCEMENT',
            title: 'Very Old Announcement',
            status: 'PUBLISHED',
            last_activity_at: '2025-01-01T00:00:00Z',
            age_days: 435,
            recommended_action: 'ARCHIVE',
          },
          {
            id: 'c2',
            content_type: 'ANNOUNCEMENT',
            title: 'Slightly Stale Announcement',
            status: 'PUBLISHED',
            last_activity_at: '2025-11-01T00:00:00Z',
            age_days: 130,
            recommended_action: 'FLAG_STALE',
          },
        ],
      };

      const updatedPolicy = { ...initialPolicy, stale_after_days: 60 };

      // Step 1: Initial load
      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: [initialPolicy], candidates: candidatesWithArchivable },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // Verify initial state
      cy.contains('td', '90').should('be.visible');
      cy.contains('h3', 'Retention Candidates').should('be.visible');
      cy.contains('td', 'Very Old Announcement').should('be.visible');

      // Step 2: Edit the policy
      cy.intercept('PATCH', '/api/admin/retention', {
        statusCode: 200,
        body: { data: updatedPolicy, error: null },
      }).as('patchPolicy');

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: [updatedPolicy], candidates: candidatesWithArchivable },
          error: null,
        },
      }).as('getRetentionAfterEdit');

      cy.contains('button', 'Edit').click();
      cy.get('input[type="number"]').first().type('{selectall}60');
      cy.contains('button', 'Save').click();

      cy.wait('@patchPolicy');
      cy.wait('@getRetentionAfterEdit');
      cy.contains('td', '60').should('be.visible');

      // Step 3: Archive the old announcement
      cy.intercept('POST', '/api/admin/retention', {
        statusCode: 200,
        body: { data: { archived: 1 }, error: null },
      }).as('postArchive');

      const candidatesAfterArchive = {
        totalStale: 1,
        totalArchivable: 0,
        candidates: [candidatesWithArchivable.candidates[1]],
      };

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: [updatedPolicy], candidates: candidatesAfterArchive },
          error: null,
        },
      }).as('getRetentionAfterArchive');

      cy.contains('button', 'Archive 1 announcements').click();
      cy.wait('@postArchive');
      cy.wait('@getRetentionAfterArchive');

      // The archived item should be gone, FLAG_STALE item remains
      cy.contains('td', 'Very Old Announcement').should('not.exist');
      cy.contains('td', 'Slightly Stale Announcement').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Multiple Content Types Archival
  // -----------------------------------------------------------------------

  describe('Multi-Type Archival', () => {
    it('archives candidates from different content types independently', () => {
      const mockPolicies = [
        {
          id: 'policy-ann',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockCandidates = {
        totalStale: 0,
        totalArchivable: 3,
        candidates: [
          {
            id: 'c1',
            content_type: 'ANNOUNCEMENT',
            title: 'Archive Announcement 1',
            status: 'PUBLISHED',
            last_activity_at: '2025-01-01T00:00:00Z',
            age_days: 435,
            recommended_action: 'ARCHIVE',
          },
          {
            id: 'c2',
            content_type: 'ANNOUNCEMENT',
            title: 'Archive Announcement 2',
            status: 'PUBLISHED',
            last_activity_at: '2025-02-01T00:00:00Z',
            age_days: 404,
            recommended_action: 'ARCHIVE',
          },
          {
            id: 'c3',
            content_type: 'THREAD',
            title: 'Archive Thread 1',
            status: 'OPEN',
            last_activity_at: '2025-01-01T00:00:00Z',
            age_days: 435,
            recommended_action: 'ARCHIVE',
          },
        ],
      };

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: { policies: mockPolicies, candidates: mockCandidates },
          error: null,
        },
      }).as('getRetention');

      cy.visit('/admin/retention');
      cy.wait('@getRetention');

      // Should show "Archive 2 announcements" and "Archive 1 threads"
      cy.contains('button', 'Archive 2 announcements').should('be.visible');
      cy.contains('button', 'Archive 1 threads').should('be.visible');

      // Archive announcements
      cy.intercept('POST', '/api/admin/retention', {
        statusCode: 200,
        body: { data: { archived: 2 }, error: null },
      }).as('postArchive');

      cy.intercept('GET', '/api/admin/retention', {
        statusCode: 200,
        body: {
          data: {
            policies: mockPolicies,
            candidates: {
              totalStale: 0,
              totalArchivable: 1,
              candidates: [mockCandidates.candidates[2]],
            },
          },
          error: null,
        },
      }).as('getRetentionRefresh');

      cy.contains('button', 'Archive 2 announcements').click();

      cy.wait('@postArchive')
        .its('request.body')
        .should('deep.equal', {
          content_type: 'ANNOUNCEMENT',
          ids: ['c1', 'c2'],
        });

      cy.wait('@getRetentionRefresh');

      // After refresh, only thread remains
      cy.contains('button', /Archive.*announcement/i).should('not.exist');
      cy.contains('button', 'Archive 1 threads').should('be.visible');
    });
  });
});
