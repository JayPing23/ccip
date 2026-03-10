/**
 * E2E Test: Search / Feed Filters
 *
 * Covers:
 *   - Feed page loading and structure
 *   - Search input and clear
 *   - Filter dropdowns (status, visibility, tag, sort)
 *   - Reset filters
 *   - Pagination
 *   - Empty and error states
 *   - Dashboard quick search
 */

describe('Search & Feed', () => {
  // -----------------------------------------------------------------------
  // Feed Page Structure
  // -----------------------------------------------------------------------

  describe('Feed Page Structure', () => {
    it('displays the Announcement feed heading', () => {
      cy.loginAsSeededEditor();
      cy.visit('/feed');
      cy.contains('h2', 'Announcement feed').should('be.visible');
      cy.contains('Official Feed').should('be.visible');
    });

    it('shows header action links for editors', () => {
      cy.loginAsSeededEditor();
      cy.visit('/feed');
      cy.contains('a', 'New Announcement').should('be.visible');
      cy.contains('a', 'Manage Announcements').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Search Input
  // -----------------------------------------------------------------------

  describe('Search Input', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: { data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }, error: null },
      }).as('search');
    });

    it('displays the search input', () => {
      cy.visit('/feed');
      cy.get('input[aria-label="Search announcements"]').should('be.visible');
    });

    it('searches when typing in the search box', () => {
      cy.visit('/feed');
      cy.get('input[aria-label="Search announcements"]').type('campus event');
    });

    it('shows clear button when search has text', () => {
      cy.visit('/feed');
      cy.get('input[aria-label="Search announcements"]').type('test');
      cy.get('button[aria-label="Clear search"]').should('be.visible');
    });

    it('clears search when clicking clear button', () => {
      cy.visit('/feed');
      cy.get('input[aria-label="Search announcements"]').type('test');
      cy.get('button[aria-label="Clear search"]').click();
      cy.get('input[aria-label="Search announcements"]').should('have.value', '');
    });
  });

  // -----------------------------------------------------------------------
  // Filter Dropdowns
  // -----------------------------------------------------------------------

  describe('Filters', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: { data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }, error: null },
      }).as('search');
    });

    it('has status filter with correct options', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by status"]').should('be.visible');
      cy.get('select[aria-label="Filter by status"]')
        .find('option')
        .should('have.length.at.least', 4);
    });

    it('has visibility filter', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by visibility"]').should('be.visible');
    });

    it('has tag filter', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by tag"]').should('be.visible');
    });

    it('has sort dropdown', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Sort results"]').should('be.visible');
    });

    it('filters by status', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by status"]').select('PUBLISHED');
    });

    it('filters by visibility', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by visibility"]').select('PUBLIC');
    });

    it('sorts by newest first', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Sort results"]').select('newest');
    });

    it('shows Reset filters button when filters are active', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by status"]').select('DRAFT');
      cy.contains('button', 'Reset filters').should('be.visible');
    });

    it('resets filters when clicking Reset filters', () => {
      cy.visit('/feed');
      cy.get('select[aria-label="Filter by status"]').select('DRAFT');
      cy.contains('button', 'Reset filters').click();
      cy.get('select[aria-label="Filter by status"]').should('have.value', 'ALL');
    });
  });

  // -----------------------------------------------------------------------
  // Search Results
  // -----------------------------------------------------------------------

  describe('Search Results', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
    });

    it('shows result count', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          data: {
            items: [
              {
                content: {
                  id: 'c-1',
                  title: 'Campus Event Tomorrow',
                  slug: 'campus-event',
                  body: 'Join us for a campus-wide event.',
                  status: 'PUBLISHED',
                  visibility: 'PUBLIC',
                  tags: ['EVENT'],
                  author: { display_name: 'Editor' },
                  published_at: '2026-03-10T00:00:00Z',
                  created_at: '2026-03-09T00:00:00Z',
                  updated_at: '2026-03-09T00:00:00Z',
                },
                matchedFields: ['title'],
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
          },
          error: null,
        },
      }).as('search');

      cy.visit('/feed');
      cy.wait('@search');
      cy.contains('1 result').should('be.visible');
    });

    it('renders content cards for results', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          data: {
            items: [
              {
                content: {
                  id: 'c-1',
                  title: 'Campus Event Tomorrow',
                  slug: 'campus-event',
                  body: 'Join us.',
                  status: 'PUBLISHED',
                  visibility: 'PUBLIC',
                  tags: [],
                  author: { display_name: 'Editor' },
                  published_at: '2026-03-10T00:00:00Z',
                  created_at: '2026-03-09T00:00:00Z',
                  updated_at: '2026-03-09T00:00:00Z',
                },
                matchedFields: [],
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
          },
          error: null,
        },
      }).as('search');

      cy.visit('/feed');
      cy.wait('@search');
      cy.get('[data-testid="content-card-title"]').should('contain', 'Campus Event Tomorrow');
    });

    it('shows empty state when no results', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: { data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }, error: null },
      }).as('search');

      cy.visit('/feed');
      cy.wait('@search');
      cy.contains('No announcements found.').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 500,
        body: { data: null, error: { message: 'Search failed' } },
      }).as('searchErr');

      cy.visit('/feed');
      cy.wait('@searchErr');
      cy.contains('Failed to load announcements').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------

  describe('Pagination', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
    });

    it('shows pagination when results span multiple pages', () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: `c-${i}`,
        title: `Announcement ${i + 1}`,
        slug: `announcement-${i + 1}`,
        body: 'Body',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        tags: [],
        author: { display_name: 'Editor' },
        published_at: '2026-03-10T00:00:00Z',
        created_at: '2026-03-09T00:00:00Z',
        updated_at: '2026-03-09T00:00:00Z',
      }));

      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          data: {
            items: results.map((r) => ({ content: r, matchedFields: [] })),
            total: 25,
            page: 1,
            pageSize: 10,
            totalPages: 3,
          },
          error: null,
        },
      }).as('search');

      cy.visit('/feed');
      cy.wait('@search');
      cy.get('nav[aria-label="Pagination"]').should('be.visible');
      cy.contains('Page 1').should('be.visible');
    });

    it('Previous button is disabled on first page', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          data: {
            items: [
              {
                content: {
                  id: 'c-1',
                  title: 'Announcement',
                  slug: 'a',
                  body: 'B',
                  status: 'PUBLISHED',
                  visibility: 'PUBLIC',
                  tags: [],
                  author: { display_name: 'E' },
                  published_at: '2026-03-10T00:00:00Z',
                  created_at: '2026-03-09T00:00:00Z',
                  updated_at: '2026-03-09T00:00:00Z',
                },
                matchedFields: [],
              },
            ],
            total: 25,
            page: 1,
            pageSize: 10,
            totalPages: 3,
          },
          error: null,
        },
      }).as('search');

      cy.visit('/feed');
      cy.wait('@search');
      cy.contains('button', 'Previous').should('be.disabled');
    });
  });

  // -----------------------------------------------------------------------
  // Dashboard Quick Search
  // -----------------------------------------------------------------------

  describe('Dashboard Quick Search', () => {
    it('navigates to feed with search query', () => {
      cy.loginAsSeededEditor();
      cy.visit('/dashboard');
      cy.get('input[aria-label="Quick search announcements"]').type('library');
      cy.contains('button', 'Search').click();
      cy.location('pathname').should('eq', '/feed');
      cy.location('search').should('include', 'q=library');
    });
  });
});
