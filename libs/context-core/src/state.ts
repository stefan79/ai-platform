import fs from 'fs';
import path from 'path';

export type HealthStatus = 'ok';

export interface HealthState {
  status: HealthStatus;
}

export interface ContextState {
  version: string;
  health: HealthState;
}

export interface ContextStateOptions {
  version: string;
  healthStatus?: HealthStatus;
}

export const createContextState = (options: ContextStateOptions): ContextState => ({
  version: options.version,
  health: {
    status: options.healthStatus ?? 'ok',
  },
});

export const defaultPackageJsonPath = path.resolve(process.cwd(), 'package.json');

export function readWorkspaceVersion(packageJsonPath: string = defaultPackageJsonPath): string {
  const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf-8');
  const parsed = JSON.parse(packageJsonRaw) as { version?: string };

  if (!parsed.version) {
    throw new Error(`Version missing in package.json at ${packageJsonPath}`);
  }

  return parsed.version;
}
