import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "ezz7q3",
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1440,
  viewportHeight: 900,

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:3000",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
