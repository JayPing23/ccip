function getConfiguredCredentials() {
  const email = Cypress.env('E2E_USER_EMAIL');
  const password = Cypress.env('E2E_USER_PASSWORD');

  if ((email && !password) || (!email && password)) {
    throw new Error(
      'Set both CYPRESS_E2E_USER_EMAIL and CYPRESS_E2E_USER_PASSWORD, or set neither to use the local seed route.'
    );
  }

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function seedEditorCredentials() {
  return cy.request('POST', '/api/auth/e2e/seed-editor').then(({ body }) => {
    if (!body?.success || !body?.credentials?.email || !body?.credentials?.password) {
      throw new Error(body?.error || 'Failed to seed the local E2E editor account.');
    }

    return body.credentials;
  });
}

Cypress.Commands.add('loginAsSeededEditor', () => {
  const configuredCredentials = getConfiguredCredentials();
  const credentialsRequest = configuredCredentials
    ? cy.wrap(configuredCredentials, { log: false })
    : seedEditorCredentials();

  return credentialsRequest.then(({ email, password }) => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').should('be.visible').clear().type(email);
    cy.get('[data-testid="login-password-input"]').clear().type(password, { log: false });
    cy.get('[data-testid="login-submit-button"]').click();
    cy.location('pathname', { timeout: 20000 }).should('eq', '/dashboard');
  });
});

function seedAdminCredentials() {
  return cy.request('POST', '/api/auth/e2e/seed-admin').then(({ body }) => {
    if (!body?.success || !body?.credentials?.email || !body?.credentials?.password) {
      throw new Error(body?.error || 'Failed to seed the local E2E admin account.');
    }

    return body.credentials;
  });
}

Cypress.Commands.add('loginAsSeededAdmin', () => {
  const email = Cypress.env('E2E_ADMIN_EMAIL');
  const password = Cypress.env('E2E_ADMIN_PASSWORD');

  if ((email && !password) || (!email && password)) {
    throw new Error(
      'Set both CYPRESS_E2E_ADMIN_EMAIL and CYPRESS_E2E_ADMIN_PASSWORD, or set neither to use the local seed route.'
    );
  }

  const configuredCredentials = email && password ? { email, password } : null;
  const credentialsRequest = configuredCredentials
    ? cy.wrap(configuredCredentials, { log: false })
    : seedAdminCredentials();

  return credentialsRequest.then(({ email, password }) => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').should('be.visible').clear().type(email);
    cy.get('[data-testid="login-password-input"]').clear().type(password, { log: false });
    cy.get('[data-testid="login-submit-button"]').click();
    cy.location('pathname', { timeout: 20000 }).should('eq', '/dashboard');
  });
});
