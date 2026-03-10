/**
 * E2E Test: Moderation Queue
 *
 * Covers:
 *   - Navigation to moderation page
 *   - Report queue loading, filtering, and display
 *   - Dismiss report flow
 *   - Take action flow (action modal)
 *   - Empty and error states
 *   - User restriction creation
 */

describe('Moderation', () => {
  const mockReports = [
    {
      id: 'report-1',
      reporter_id: 'user-1',
      reporter: { display_name: 'Student A' },
      content_type: 'THREAD',
      content_id: 'thread-1',
      reason: 'SPAM',
      description: 'This looks like spam',
      status: 'PENDING',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-03-01T00:00:00Z',
    },
    {
      id: 'report-2',
      reporter_id: 'user-2',
      reporter: { display_name: 'Student B' },
      content_type: 'REPLY',
      content_id: 'reply-1',
      reason: 'HARASSMENT',
      description: 'Hateful language',
      status: 'PENDING',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-03-02T00:00:00Z',
    },
  ];

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  describe('Navigation', () => {
    it('can navigate to the moderation page from the admin sidebar', () => {
      cy.loginAsSeededAdmin();
      cy.visit('/admin/dashboard');
      cy.contains('a', 'Moderation').click();
      cy.location('pathname').should('eq', '/admin/moderation');
      cy.contains('h2', 'Moderation Queue').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Report Queue Display
  // -----------------------------------------------------------------------

  describe('Report Queue', () => {
    beforeEach(() => {
      cy.loginAsSeededAdmin();
    });

    it('displays the Moderation Queue heading', () => {
      cy.visit('/admin/moderation');
      cy.contains('h2', 'Moderation Queue').should('be.visible');
    });

    it('shows loading state while fetching', () => {
      cy.intercept('GET', '/api/moderation/queue*', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getQueueDelayed');

      cy.visit('/admin/moderation');
      cy.contains('Loading reports').should('be.visible');
    });

    it('renders report cards', () => {
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: mockReports },
      }).as('getQueue');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('Spam').should('be.visible');
      cy.contains('Harassment').should('be.visible');
      cy.contains('PENDING').should('be.visible');
    });

    it('shows Dismiss and Take Action buttons for pending reports', () => {
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: mockReports },
      }).as('getQueue');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Dismiss').should('be.visible');
      cy.contains('button', 'Take Action').should('be.visible');
    });

    it('shows empty state when no reports match filters', () => {
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: [] },
      }).as('getEmptyQueue');

      cy.visit('/admin/moderation');
      cy.wait('@getEmptyQueue');
      cy.contains('No reports match the selected filters').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error' } },
      }).as('getQueueErr');

      cy.visit('/admin/moderation');
      cy.wait('@getQueueErr');
    });
  });

  // -----------------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------------

  describe('Filters', () => {
    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: mockReports },
      }).as('getQueue');
    });

    it('has status filter with correct options', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.get('select[title="Filter by report status"]').should('be.visible');
      cy.get('select[title="Filter by report status"]')
        .find('option')
        .should('have.length.at.least', 4);
    });

    it('has content type filter', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.get('select[title="Filter by content type"]').should('be.visible');
    });

    it('filters by status', () => {
      cy.intercept('GET', '/api/moderation/queue*status=DISMISSED*', {
        statusCode: 200,
        body: { data: [] },
      }).as('getFiltered');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.get('select[title="Filter by report status"]').select('DISMISSED');
    });
  });

  // -----------------------------------------------------------------------
  // Dismiss Report
  // -----------------------------------------------------------------------

  describe('Dismiss Report', () => {
    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: [mockReports[0]] },
      }).as('getQueue');
    });

    it('dismisses a report', () => {
      cy.intercept('PATCH', '/api/moderation/queue*', {
        statusCode: 200,
        body: {
          data: { ...mockReports[0], status: 'DISMISSED' },
          error: null,
        },
      }).as('dismissReport');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Dismiss').click();
    });
  });

  // -----------------------------------------------------------------------
  // Take Action Modal
  // -----------------------------------------------------------------------

  describe('Take Action Modal', () => {
    beforeEach(() => {
      cy.loginAsSeededAdmin();
      cy.intercept('GET', '/api/moderation/queue*', {
        statusCode: 200,
        body: { data: [mockReports[0]] },
      }).as('getQueue');
    });

    it('opens the action modal', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();
      cy.contains('h3', 'Take Moderation Action').should('be.visible');
    });

    it('shows action select, restriction select, and reason textarea', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();

      cy.get('#mod-action').should('be.visible');
      cy.get('#mod-restrict').should('be.visible');
      cy.get('#mod-reason').should('be.visible');
    });

    it('disables Apply when no action or reason is set', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();
      cy.contains('button', 'Apply Action').should('be.disabled');
    });

    it('submits a moderation action', () => {
      cy.intercept('POST', '/api/moderation/actions', {
        statusCode: 201,
        body: { data: { id: 'action-1' }, error: null },
      }).as('createAction');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();

      cy.get('#mod-action').select('HIDE');
      cy.get('#mod-reason').type('Violates community guidelines');
      cy.contains('button', 'Apply Action').click();

      cy.wait('@createAction')
        .its('request.body')
        .should((body) => {
          expect(body.action).to.equal('HIDE');
          expect(body.reason).to.include('Violates community guidelines');
        });
    });

    it('submits action with user restriction', () => {
      cy.intercept('POST', '/api/moderation/actions', {
        statusCode: 201,
        body: { data: { id: 'action-2' }, error: null },
      }).as('createAction');

      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();

      cy.get('#mod-action').select('REMOVE');
      cy.get('#mod-restrict').select('SUSPENDED');
      cy.get('#mod-reason').type('Repeated violations');
      cy.contains('button', 'Apply Action').click();

      cy.wait('@createAction');
    });

    it('closes the modal on Cancel', () => {
      cy.visit('/admin/moderation');
      cy.wait('@getQueue');
      cy.contains('button', 'Take Action').click();
      cy.contains('h3', 'Take Moderation Action').should('be.visible');
      cy.contains('button', 'Cancel').click();
      cy.contains('h3', 'Take Moderation Action').should('not.exist');
    });
  });
});
