'use strict';

const path = require('path');

const STRATEGY_PATH = path.normalize('apps/server-core/src/event/strategies');

module.exports = {
  rules: {
    'require-event-definitions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require eventDefinitions export in server-core event strategies.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes(STRATEGY_PATH) || !filename.endsWith('.strategy.ts')) {
          return {};
        }

        let hasEventDefinitionsExport = false;

        return {
          ExportNamedDeclaration(node) {
            if (!node.declaration || node.declaration.type !== 'VariableDeclaration') {
              return;
            }
            for (const declaration of node.declaration.declarations) {
              if (declaration.id && declaration.id.name === 'eventDefinitions') {
                hasEventDefinitionsExport = true;
              }
            }
          },
          'Program:exit'(node) {
            if (hasEventDefinitionsExport) {
              return;
            }
            context.report({
              node,
              message: 'Event strategies must export `eventDefinitions` to support protocol generation.',
            });
          },
        };
      },
    },
  },
};
