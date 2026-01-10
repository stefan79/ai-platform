import { names, Tree, generateFiles } from '@nx/devkit';
import path from 'path';

type Schema = {
  name: string;
  eventType: string;
};

export default async function eventStrategyGenerator(tree: Tree, schema: Schema) {
  const { fileName, className } = names(schema.name);
  const targetDir = path.join('apps/server-core/src/event/strategies');

  generateFiles(tree, path.join(__dirname, 'files'), targetDir, {
    tmpl: '',
    fileName,
    className,
    eventType: schema.eventType,
  });
}
