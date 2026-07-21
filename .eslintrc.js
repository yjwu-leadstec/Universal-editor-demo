module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always', mjs: 'always' }], // require source file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'xwalk/max-cells': ['error', {
      carousel: 6,
      slide: 8,
      'product-card': 8,
      'vehicle-tile': 8,
      'banner-slide': 6,
      'carousel-card': 6,
      'home-carousel': 6,
      'header-settings': 8,
      'chapter-intro': 16,
      'color-switcher': 5,
      'color-switcher-item': 7,
      'feature-grid': 7,
      'feature-grid-item': 6,
      'feature-media-section': 15,
      'feature-media-item': 12,
      'highlight-carousel': 9,
      'highlight-slide': 12,
      'image-switcher': 11,
      'image-switcher-item': 10,
      'big-small-gallery': 10,
      'big-small-item': 10,
      'locale-option': 7,
      'icon-overlay-showcase': 5,
      'overlay-panel': 7,
      'overlay-hotspot': 7,
      'picture-group': 9,
      'picture-media-item': 7,
      'product-download': 8,
      'product-ending': 9,
      'product-guide-item': 5,
      'product-hero': 13,
      'product-param-cta': 9,
      'spec-table': 6,
      'spec-group': 6,
      'text-columns': 5,
    }], // models needing more fields
    // mobileTitle and Open Graph fields are intentional domain names, not collapse suffixes.
    'xwalk/no-orphan-collapsible-fields': 'off',
  },
};
