const designTokensPreset = require('../../libs/design-tokens/tailwind.preset.cjs');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../libs/design-tokens/src/**/*.{ts,css}',
  ],
  presets: [designTokensPreset],
  theme: {
    extend: {},
  },
};
