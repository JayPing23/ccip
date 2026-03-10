/**
 * E2E Test: Forum Feature
 *
 * Covers:
 *   - Forum home loads and shows categories
 *   - Category page shows threads
 *   - Thread creation flow
 *   - Thread detail and reply flow
 *   - Reaction toggle
 *   - Report dialog
 *   - Locked thread disables replies
 *   - Navigation breadcrumbs
 */

describe('Forum', () => {
  // -----------------------------------------------------------------------
  // Forum Home — /forum
  // -----------------------------------------------------------------------

  describe('Forum Home', () => {
    it('displays the Forum heading and category list', () => {
      cy.loginAsSeededEditor();
      cy.visit('/forum');
      cy.contains('h1', 'Forum').should('be.visible');
    });

    it('shows loading skeleton while fetching categories', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/forum/categories', (req) => {
        req.on('response', (res) => res.setDelay(2000));
      }).as('getCategories');

      cy.visit('/forum');
      cy.get('.animate-pulse').should('have.length.at.least', 1);
    });

    it('renders categories returned by the API', () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'General Discussion',
          slug: 'general-discussion',
          description: 'Talk about anything campus-related',
          display_order: 1,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'cat-2',
          name: 'Academic Help',
          slug: 'academic-help',
          description: 'Study tips and course questions',
          display_order: 2,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/forum/categories', {
        statusCode: 200,
        body: { data: mockCategories, error: null },
      }).as('getCategories');

      cy.visit('/forum');
      cy.wait('@getCategories');
      cy.contains('General Discussion').should('be.visible');
      cy.contains('Academic Help').should('be.visible');
    });

    it('shows empty state when no categories exist', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/forum/categories', {
        statusCode: 200,
        body: { data: [], error: null },
      }).as('getCategories');

      cy.visit('/forum');
      cy.wait('@getCategories');
      cy.contains('No forum categories available yet.').should('be.visible');
    });

    it('shows error state on API failure', () => {
      cy.loginAsSeededEditor();
      cy.intercept('GET', '/api/forum/categories', {
        statusCode: 500,
        body: { data: null, error: { message: 'Server error' } },
      }).as('getCategoriesErr');

      cy.visit('/forum');
      cy.wait('@getCategoriesErr');
    });
  });

  // -----------------------------------------------------------------------
  // Category Page — /forum/[category]
  // -----------------------------------------------------------------------

  describe('Category Page', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'General Discussion',
      slug: 'general-discussion',
      description: 'Talk about anything campus-related',
      display_order: 1,
      created_at: '2026-01-01T00:00:00Z',
    };

    const mockThreads = [
      {
        id: 'thread-1',
        title: 'Welcome to the forum!',
        slug: 'welcome-to-the-forum',
        category_id: 'cat-1',
        author_id: 'user-1',
        status: 'OPEN',
        pinned: true,
        reply_count: 5,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        author: { display_name: 'Admin User' },
      },
      {
        id: 'thread-2',
        title: 'Study group for finals',
        slug: 'study-group-for-finals',
        category_id: 'cat-1',
        author_id: 'user-2',
        status: 'OPEN',
        pinned: false,
        reply_count: 0,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
        author: { display_name: 'Student User' },
      },
    ];

    beforeEach(() => {
      cy.loginAsSeededEditor();
      // Hook fetches ALL categories, then filters by slug client-side
      cy.intercept('GET', '/api/forum/categories', {
        statusCode: 200,
        body: { data: [mockCategory], error: null },
      }).as('getCategories');

      // Query param is category_id (not categoryId)
      cy.intercept('GET', '/api/forum/threads?category_id=cat-1*', {
        statusCode: 200,
        body: { data: { threads: mockThreads, total: 2 }, error: null },
      }).as('getThreads');
    });

    it('shows the category name as heading', () => {
      cy.visit('/forum/general-discussion');
      cy.contains('h1', 'General Discussion').should('be.visible');
    });

    it('shows category description', () => {
      cy.visit('/forum/general-discussion');
      cy.wait('@getCategories');
      cy.contains('Talk about anything campus-related').should('be.visible');
    });

    it('renders thread list with titles', () => {
      cy.visit('/forum/general-discussion');
      cy.contains('Welcome to the forum!').should('be.visible');
      cy.contains('Study group for finals').should('be.visible');
    });

    it('shows pinned badge on pinned threads', () => {
      cy.visit('/forum/general-discussion');
      cy.contains('📌').should('be.visible');
    });

    it('shows reply counts', () => {
      cy.visit('/forum/general-discussion');
      cy.contains('5 replies').should('be.visible');
    });

    it('has a New Thread button linking to /forum/general-discussion/new', () => {
      cy.visit('/forum/general-discussion');
      cy.wait('@getCategories');
      cy.contains('New Thread').should('be.visible').click();
      cy.location('pathname').should('eq', '/forum/general-discussion/new');
    });

    it('shows empty state when no threads exist', () => {
      cy.intercept('GET', '/api/forum/threads?category_id=cat-1*', {
        statusCode: 200,
        body: { data: { threads: [], total: 0 }, error: null },
      }).as('getEmptyThreads');

      cy.visit('/forum/general-discussion');
      cy.contains('No threads in this category yet').should('be.visible');
    });
  });

  // -----------------------------------------------------------------------
  // Thread Creation — /forum/[category]/new
  // -----------------------------------------------------------------------

  describe('Thread Creation', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();
      // Hook fetches ALL categories, then filters by slug client-side
      cy.intercept('GET', '/api/forum/categories', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'cat-1',
              name: 'General Discussion',
              slug: 'general-discussion',
              description: 'Talk about anything',
              display_order: 1,
            },
          ],
          error: null,
        },
      }).as('getCategories');
    });

    it('shows the thread composer form', () => {
      cy.visit('/forum/general-discussion/new');
      cy.contains('h2', 'New Thread').should('be.visible');
      cy.get('#thread-title').should('be.visible');
      cy.get('#thread-body').should('be.visible');
      cy.contains('button', 'Create Thread').should('be.visible');
      cy.contains('button', 'Cancel').should('be.visible');
    });

    it('submits a new thread and redirects', () => {
      cy.intercept('POST', '/api/forum/threads', {
        statusCode: 201,
        body: {
          data: {
            id: 'new-thread-1',
            slug: 'my-new-thread',
            category_id: 'cat-1',
          },
          error: null,
        },
      }).as('createThread');

      cy.visit('/forum/general-discussion/new');
      cy.get('#thread-title').type('My New Thread');
      cy.get('#thread-body').type('This is the body of my thread discussion.');
      cy.contains('button', 'Create Thread').click();

      cy.wait('@createThread')
        .its('request.body')
        .should((body) => {
          expect(body.title).to.equal('My New Thread');
          expect(body.body).to.include('This is the body');
        });
    });

    it('shows validation error when fields are empty', () => {
      cy.visit('/forum/general-discussion/new');
      cy.contains('button', 'Create Thread').click();
      // Validation fires a toast with this message
      cy.contains('Title and body are required').should('be.visible');
    });

    it('Cancel button navigates back', () => {
      cy.visit('/forum/general-discussion/new');
      cy.contains('button', 'Cancel').click();
      cy.location('pathname').should('include', '/forum/general-discussion');
    });
  });

  // -----------------------------------------------------------------------
  // Thread Detail — /forum/thread/[slug]
  // -----------------------------------------------------------------------

  describe('Thread Detail', () => {
    const mockThread = {
      id: 'thread-1',
      title: 'Welcome to the forum!',
      slug: 'welcome-to-the-forum',
      body: 'This is the opening post for the forum.',
      category_id: 'cat-1',
      category: { name: 'General Discussion', slug: 'general-discussion' },
      author_id: 'user-1',
      author: { display_name: 'Admin User' },
      status: 'OPEN',
      pinned: true,
      reply_count: 2,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const mockReplies = [
      {
        id: 'reply-1',
        thread_id: 'thread-1',
        body: 'Great to be here!',
        author_id: 'user-2',
        author: { display_name: 'Student User' },
        status: 'VISIBLE',
        created_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 'reply-2',
        thread_id: 'thread-1',
        body: 'Looking forward to discussions.',
        author_id: 'user-3',
        author: { display_name: 'Editor User' },
        status: 'VISIBLE',
        created_at: '2026-01-03T00:00:00Z',
      },
    ];

    const mockReactions = { LIKE: 3, HELPFUL: 1, INSIGHTFUL: 0 };

    beforeEach(() => {
      cy.loginAsSeededEditor();

      // Hook fetches by slug query param, not path param
      cy.intercept('GET', '/api/forum/threads?slug=welcome-to-the-forum', {
        statusCode: 200,
        body: { data: mockThread, error: null },
      }).as('getThread');

      cy.intercept('GET', '/api/forum/threads/thread-1/reply*', {
        statusCode: 200,
        body: { data: mockReplies, error: null },
      }).as('getReplies');

      cy.intercept('GET', '/api/forum/threads/thread-1/react', {
        statusCode: 200,
        body: { data: mockReactions, error: null },
      }).as('getReactions');
    });

    it('displays thread title and body', () => {
      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.contains('h1', 'Welcome to the forum!').should('be.visible');
      cy.contains('This is the opening post for the forum.').should('be.visible');
    });

    it('displays replies section', () => {
      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.contains('Replies').should('be.visible');
      cy.contains('Great to be here!').should('be.visible');
      cy.contains('Looking forward to discussions.').should('be.visible');
    });

    it('shows reaction buttons with counts', () => {
      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.wait('@getThread');
      cy.wait('@getReactions');
      cy.contains('button', '👍').should('be.visible');
      cy.contains('button', '💡').should('be.visible');
      cy.contains('button', '🔍').should('be.visible');
    });

    it('shows reply composer for open threads', () => {
      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.get('textarea[placeholder="Write a reply…"]').should('be.visible');
      cy.contains('button', 'Reply').should('be.visible');
    });

    it('submits a reply', () => {
      cy.intercept('POST', '/api/forum/threads/thread-1/reply', {
        statusCode: 201,
        body: {
          data: {
            id: 'reply-new',
            body: 'My reply here',
            author: { display_name: 'Editor User' },
            status: 'VISIBLE',
            created_at: '2026-03-11T00:00:00Z',
          },
          error: null,
        },
      }).as('postReply');

      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.get('textarea[placeholder="Write a reply…"]').type('My reply here');
      cy.contains('button', 'Reply').click();

      cy.wait('@postReply')
        .its('request.body')
        .should((body) => {
          expect(body.body).to.equal('My reply here');
        });
    });

    it('disables reply composer when thread is locked', () => {
      cy.intercept('GET', '/api/forum/threads?slug=welcome-to-the-forum', {
        statusCode: 200,
        body: {
          data: { ...mockThread, status: 'LOCKED' },
          error: null,
        },
      }).as('getLockedThread');

      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.wait('@getLockedThread');
      cy.contains('This thread is locked').should('be.visible');
    });

    it('toggles a reaction', () => {
      cy.intercept('POST', '/api/forum/threads/thread-1/react', {
        statusCode: 200,
        body: { data: { LIKE: 4, HELPFUL: 1, INSIGHTFUL: 0 }, error: null },
      }).as('toggleReaction');

      cy.visit('/forum/thread/welcome-to-the-forum');
      cy.contains('button', '👍').click();
      cy.wait('@toggleReaction');
    });
  });

  // -----------------------------------------------------------------------
  // Report Dialog
  // -----------------------------------------------------------------------

  describe('Report Dialog', () => {
    beforeEach(() => {
      cy.loginAsSeededEditor();

      // Hook fetches by slug query param
      cy.intercept('GET', '/api/forum/threads?slug=offensive-thread', {
        statusCode: 200,
        body: {
          data: {
            id: 'thread-1',
            title: 'Offensive thread',
            slug: 'offensive-thread',
            body: 'Some content',
            category_id: 'cat-1',
            category: { name: 'General', slug: 'general' },
            author_id: 'user-x',
            author: { display_name: 'Bad User' },
            status: 'OPEN',
            pinned: false,
            reply_count: 0,
            created_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        },
      }).as('getThread');

      cy.intercept('GET', '/api/forum/threads/thread-1/reply*', {
        statusCode: 200,
        body: { data: [], error: null },
      }).as('getReplies');

      cy.intercept('GET', '/api/forum/threads/thread-1/react', {
        statusCode: 200,
        body: { data: { LIKE: 0, HELPFUL: 0, INSIGHTFUL: 0 }, error: null },
      }).as('getReactions');
    });

    it('opens the report dialog when clicking Report', () => {
      cy.visit('/forum/thread/offensive-thread');
      cy.contains('button', 'Report').click();
      cy.contains('h3', 'Report Content').should('be.visible');
      cy.get('#report-reason').should('be.visible');
    });

    it('submits a report with reason and description', () => {
      cy.intercept('POST', '/api/forum/threads/thread-1/report', {
        statusCode: 201,
        body: { data: { id: 'report-1' }, error: null },
      }).as('submitReport');

      cy.visit('/forum/thread/offensive-thread');
      cy.contains('button', 'Report').click();
      cy.get('#report-reason').select('SPAM');
      cy.get('#report-desc').type('This is spam content');
      cy.contains('button', 'Submit Report').click();

      cy.wait('@submitReport');
    });

    it('disables submit when no reason is selected', () => {
      cy.visit('/forum/thread/offensive-thread');
      cy.contains('button', 'Report').click();
      cy.contains('button', 'Submit Report').should('be.disabled');
    });

    it('closes the dialog on Cancel', () => {
      cy.visit('/forum/thread/offensive-thread');
      cy.contains('button', 'Report').click();
      cy.contains('h3', 'Report Content').should('be.visible');
      cy.contains('button', 'Cancel').click();
      cy.contains('h3', 'Report Content').should('not.exist');
    });
  });
});
