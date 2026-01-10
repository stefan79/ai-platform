import { designTokens, designTokensClassName, designTokensStylesheet } from './index';

describe('design tokens', () => {
  it('exposes palette and references', () => {
    expect(designTokens.colors.accent).toBeDefined();
    expect(designTokensClassName).toBe('ai-platform-theme');
    expect(designTokensStylesheet).toContain('design-tokens/styles.css');
  });
});
