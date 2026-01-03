import fs from 'fs';
import os from 'os';
import path from 'path';
import { createContextState, readWorkspaceVersion } from './state';

describe('context-core state', () => {
  it('creates a default health state', () => {
    const state = createContextState({ version: '0.1.0' });
    expect(state).toEqual({
      version: '0.1.0',
      health: { status: 'ok' }
    });
  });

  it('reads a version from a package.json file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-core-'));
    const packageJsonPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify({ version: '9.9.9' }), 'utf-8');

    expect(readWorkspaceVersion(packageJsonPath)).toBe('9.9.9');
  });
});
