/**
 * E2E Test: Publication / Campus News Workflow
 *
 * Covers:
 *   - News listing page with section filter
 *   - Article creation flow
 *   - Article detail page
 *   - Editorial workflow: submit for review → approve → publish
 *   - Archive flow
 *   - Revision request flow
 *   - Empty and error states
 */

describe('Publication / Campus News', () => {
  // -----------------------------------------------------------------------
  // News Listing — /news
  // -----------------------------------------------------------------------

  describe('News Listing', () => {
    it('displays the Campus News heading', () => {
      cy.loginAsSeededEditor();
      cy.visit('/news');
      cy.contains('h1', 'Campus News', { timeout: 10000 }).should('be.visible');
      cy.contains('Stories, features, and opinion pieces').should('be.visible');
    });

    it('renders articles from the API', () => {
      const mockArticles = [
        {
          id: 'art-1',
          title: 'New Library Building Opens',
          slug: 'new-library-building',
          excerpt: 'The campus welcomes a new state-of-the-art library.',
          section: 'NEWS',
          status: 'PUBLISHED',
          published_at: '2026-03-01T00:00:00Z',
          created_at: '2026-02-28T00:00:00Z',
          author: { display_name: 'Editor User' },
        },
        {
          id: 'art-2',
          title: 'Student Council Election Results',
          slug: 'student-council-elections',
          excerpt: 'The votes are in for the new student council.',
          section: 'FEATURES',
          status: 'PUBLISHED',
          published_at: '2026-03-05T00:00:00Z',
          created_at: '2026-03-04T00:00:00Z',
          author: { display_name: 'Reporter User' },
        },
      ];

      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/publication*', {
        statusCode: 200,
        body: { data: mockArticles },
      }).as('getArticles');

      cy.visit('/news');
      cy.wait('@getArticles');
      cy.contains('New Library Building Opens').should('be.visible');
      cy.contains('Student Council Election Results').should('be.visible');
    });

    it('filters articles by section', () => {
      const mockArticles = [
        {
          id: 'art-1',
          title: 'Test Article',
          slug: 'test-article',
          excerpt: 'Test',
          section: 'NEWS',
          status: 'PUBLISHED',
          published_at: '2026-03-01T00:00:00Z',
          created_at: '2026-02-28T00:00:00Z',
        },
      ];

      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/publication*', {
        statusCode: 200,
        body: { data: mockArticles },
      }).as('getArticles');

      cy.visit('/news');
      cy.wait('@getArticles');
      cy.get('#section-filter').select('OPINION');
    });

    it('shows empty state when no articles exist', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/publication*', {
        statusCode: 200,
        body: { data: [] },
      }).as('getArticles');

      cy.visit('/news');
      cy.wait('@getArticles');
      cy.contains('No articles yet.').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/publication*', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error' } },
      }).as('getArticlesErr');

      cy.visit('/news');
      cy.wait('@getArticlesErr', { timeout: 10000 });
      cy.contains('Failed to load articles').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Article Creation — /news/create
  // -----------------------------------------------------------------------

  describe('Article Creation', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
    });

    it('displays the Create Article form', () => {
      cy.visit('/news/create');
      cy.contains('h2', 'Create Article', { timeout: 10000 }).should('be.visible');
      cy.get('#title').should('be.visible');
      cy.get('#section').should('be.visible');
      cy.get('#excerpt').should('be.visible');
      cy.get('#body').should('be.visible');
      cy.contains('button', 'Create Draft').should('be.visible');
      cy.contains('button', 'Cancel').should('be.visible');
    });

    it('creates a draft article successfully', () => {
      cy.intercept('POST', '/api/publication', {
        statusCode: 201,
        body: {
          data: {
            id: 'new-art-1',
            slug: 'test-article',
            title: 'Test Article',
            status: 'DRAFT',
          },
          error: null,
        },
      }).as('createArticle');

      cy.visit('/news/create');
      cy.get('#title').type('Test Article');
      cy.get('#section').select('NEWS');
      cy.get('#byline_name').type('Cypress Reporter');
      cy.get('#excerpt').type('A test article created by Cypress.');
      cy.get('#body').type('This is the full body of the test article.');
      cy.contains('button', 'Create Draft').click();

      cy.wait('@createArticle')
        .its('request.body')
        .should((body) => {
          expect(body.title).to.equal('Test Article');
          expect(body.section).to.equal('NEWS');
        });
    });

    it('shows excerpt character count', () => {
      cy.visit('/news/create');
      cy.get('#excerpt').type('Hello');
      cy.contains('5/500').should('be.visible');
    });

    it('Cancel button navigates back', () => {
      cy.visit('/news/create');
      cy.contains('button', 'Cancel').click();
    });
  });

  // -----------------------------------------------------------------------
  // Article Detail — /news/[slug]
  // -----------------------------------------------------------------------

  describe('Article Detail', () => {
    it('displays article content', () => {
      const mockArticle = {
        id: 'art-1',
        title: 'New Library Building Opens',
        slug: 'new-library-building',
        excerpt: 'The campus welcomes a new state-of-the-art library.',
        body: '<p>Full article body content goes here.</p>',
        section: 'NEWS',
        status: 'PUBLISHED',
        published_at: '2026-03-01T00:00:00Z',
        created_at: '2026-02-28T00:00:00Z',
        author: { display_name: 'Editor User' },
      };

      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/publication?slug=new-library-building', {
        statusCode: 200,
        body: { data: mockArticle },
      }).as('getArticle');

      cy.visit('/news/new-library-building');
      cy.contains('h1', 'New Library Building Opens').should('be.visible');
      cy.contains('Full article body content goes here').should('be.visible');
      cy.contains('← Back to Campus News').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Editorial Workflow — submit → review → publish
  // -----------------------------------------------------------------------

  describe('Editorial Workflow', () => {
    const draftArticle = {
      id: 'art-wf-1',
      title: 'Workflow Test Article',
      slug: 'workflow-test',
      body: 'Article body',
      section: 'NEWS',
      status: 'DRAFT',
      author_id: 'editor-user-id',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    };

    beforeEach(() => {
      cy.loginAsSeededAdmin();
    });

    it('shows Submit for Review button on draft articles', () => {
      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: draftArticle },
      }).as('getArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Submit for Review').should('be.visible');
    });

    it('submits article for review', () => {
      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: draftArticle },
      }).as('getArticle');

      cy.intercept('POST', '/api/publication/art-wf-1/submit', {
        statusCode: 200,
        body: {
          data: { ...draftArticle, status: 'IN_REVIEW' },
          error: null,
        },
      }).as('submitForReview');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Submit for Review').click();
      cy.wait('@submitForReview');
    });

    it('shows Approve and Request Revision buttons for IN_REVIEW articles', () => {
      const inReviewArticle = { ...draftArticle, status: 'IN_REVIEW' };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: inReviewArticle },
      }).as('getArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Approve').should('be.visible');
      cy.contains('button', 'Request Revision').should('be.visible');
    });

    it('approves an article', () => {
      const inReviewArticle = { ...draftArticle, status: 'IN_REVIEW' };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: inReviewArticle },
      }).as('getArticle');

      cy.intercept('POST', '/api/publication/art-wf-1/review', {
        statusCode: 200,
        body: {
          data: { ...draftArticle, status: 'APPROVED' },
          error: null,
        },
      }).as('approveArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Approve').click();
      cy.wait('@approveArticle');
    });

    it('shows Publish button for APPROVED articles', () => {
      const approvedArticle = { ...draftArticle, status: 'APPROVED' };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: approvedArticle },
      }).as('getArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Publish').should('be.visible');
    });

    it('publishes an approved article', () => {
      const approvedArticle = { ...draftArticle, status: 'APPROVED' };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: approvedArticle },
      }).as('getArticle');

      cy.intercept('POST', '/api/publication/art-wf-1/publish', {
        statusCode: 200,
        body: {
          data: { ...draftArticle, status: 'PUBLISHED', published_at: '2026-03-11T00:00:00Z' },
          error: null,
        },
      }).as('publishArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Publish').click();
      cy.wait('@publishArticle');
    });

    it('archives an article', () => {
      const publishedArticle = {
        ...draftArticle,
        status: 'PUBLISHED',
        published_at: '2026-03-11T00:00:00Z',
      };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: publishedArticle },
      }).as('getArticle');

      cy.intercept('POST', '/api/publication/art-wf-1/publish', {
        statusCode: 200,
        body: {
          data: { ...draftArticle, status: 'ARCHIVED' },
        },
      }).as('archiveArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('button', 'Archive').click();
      cy.wait('@archiveArticle');
    });

    it('shows revision requested banner after requesting revision', () => {
      const revisedArticle = {
        ...draftArticle,
        status: 'DRAFT',
        review_note: 'Please add more sources.',
      };

      cy.intercept('GET', '/api/publication?slug=workflow-test', {
        statusCode: 200,
        body: { data: revisedArticle },
      }).as('getArticle');

      cy.visit('/news/workflow-test/edit');
      cy.contains('Review note:').should('be.visible');
      cy.contains('Please add more sources.').should('be.visible');
    });
  });
});
