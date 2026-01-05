export const designTokens = {
  colors: {
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    text: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    accent: 'var(--color-accent)',
  },
  fonts: {
    sans: 'var(--font-sans)',
  },
  radii: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
  },
};

export const designTokensClassName = 'ai-platform-theme';
export const designTokensStylesheet = '@ai-platform/design-tokens/styles.css';

export { default as tailwindPreset } from './tailwindPreset';
