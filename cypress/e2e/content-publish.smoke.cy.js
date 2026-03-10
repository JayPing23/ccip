describe('content publish smoke test', () => {
  it('creates a draft, publishes it, and exposes it in the feed', () => {
    cy.env(['E2E_PUBLISH_SMOKE_TITLE_PREFIX', 'E2E_PUBLISH_SMOKE_BODY']).then(
      ({ E2E_PUBLISH_SMOKE_TITLE_PREFIX: envTitlePrefix, E2E_PUBLISH_SMOKE_BODY: envBody }) => {
        const titlePrefix = envTitlePrefix || 'Cypress Publish Smoke';
        const title = `${titlePrefix} ${Date.now()}-${Cypress._.random(1000, 999999)}`;
        const body =
          envBody ||
          'This Cypress smoke test creates a draft announcement and publishes it through the management workflow.';

        cy.loginAsSeededEditor();

        cy.visit('/content/create');
        cy.contains('Create Announcement').should('be.visible');
        cy.get('[data-testid="content-title-input"]').type(title);
        cy.get('[data-testid="content-body-input"]').type(body);
        cy.get('[data-testid="content-save-draft-button"]').click();

        cy.contains('Content saved as draft', { timeout: 10000 }).should('be.visible');
        cy.location('pathname', { timeout: 15000 }).should('match', /^\/content\/[^/]+$/);

        cy.visit('/content/manage');
        cy.contains('Manage Announcements').should('be.visible');

        cy.contains('[data-testid="announcement-title"]', title, { timeout: 20000 })
          .should('be.visible')
          .closest('[data-testid="announcement-card"]')
          .within(() => {
            cy.get('[data-testid="announcement-status"]').should('contain', 'DRAFT');
            cy.get('[data-testid="announcement-publish-button"]').click();
          });

        cy.contains('[data-testid="announcement-title"]', title, { timeout: 20000 })
          .closest('[data-testid="announcement-card"]')
          .within(() => {
            cy.get('[data-testid="announcement-status"]').should('contain', 'PUBLISHED');
            cy.get('[data-testid="announcement-publish-button"]').should('not.exist');
          });

        cy.visit('/feed');
        cy.contains('[data-testid="content-card-title"]', title, { timeout: 20000 }).should(
          'be.visible'
        );
      }
    );
  });
});
