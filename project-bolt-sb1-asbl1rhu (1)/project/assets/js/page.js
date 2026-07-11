/**
 * FoodFiesta — Page Helpers
 * Shared boilerplate for product pages: head meta, font preconnect.
 */

export const HEAD_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
`;

export const CSS_LINKS = (depth = '') => `
  <link rel="stylesheet" href="${depth}assets/css/variables.css" />
  <link rel="stylesheet" href="${depth}assets/css/base.css" />
  <link rel="stylesheet" href="${depth}assets/css/layout.css" />
  <link rel="stylesheet" href="${depth}assets/css/components.css" />
  <link rel="stylesheet" href="${depth}assets/css/utilities.css" />
`;
