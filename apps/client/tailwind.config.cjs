const { join } = require('path');
const designTokensPreset = require('../../libs/design-tokens/tailwind.preset.cjs');

module.exports = {
  content: [
    join(__dirname, 'index.html'),
    join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, '../../libs/design-tokens/src/**/*.{ts,css}'),
  ],
  presets: [designTokensPreset],
  theme: {
    extend: {},
  },
};
