import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require('../../tsconfig.base.json');

const config: Config = {
  displayName: 'server-ws',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: '<rootDir>/../..'
  })
};

export default config;
