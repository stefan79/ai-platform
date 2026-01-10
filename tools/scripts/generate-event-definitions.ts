import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type EventDefinition = {
  type: string;
  schemaName: string;
  schemaText: string;
};

const workspaceRoot = process.cwd();
const strategiesDir = path.resolve(
  workspaceRoot,
  'apps/server-core/src/event/strategies',
);
const outputDir = path.resolve(workspaceRoot, 'libs/protocol-generated/src');
const outputFile = path.resolve(outputDir, 'events.ts');

const readSourceFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
};

const isExported = (node: ts.Node): boolean =>
  !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

const findSchemaDeclaration = (
  sourceFile: ts.SourceFile,
  schemaName: string,
): ts.VariableDeclaration | undefined => {
  const declarations: ts.VariableDeclaration[] = [];
  sourceFile.forEachChild((statement) => {
    if (!ts.isVariableStatement(statement)) {
      return;
    }
    statement.declarationList.declarations.forEach((declaration) => {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === schemaName) {
        declarations.push(declaration);
      }
    });
  });
  return declarations[0];
};

const extractEventDefinitions = (filePath: string): EventDefinition[] => {
  const sourceFile = readSourceFile(filePath);
  const text = sourceFile.getFullText();
  const definitions: EventDefinition[] = [];

  sourceFile.forEachChild((statement) => {
    if (!ts.isVariableStatement(statement) || !isExported(statement)) {
      return;
    }

    statement.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'eventDefinitions') {
        return;
      }
      if (!declaration.initializer) {
        return;
      }

      const initializer = ts.isAsExpression(declaration.initializer)
        ? declaration.initializer.expression
        : declaration.initializer;

      if (!ts.isArrayLiteralExpression(initializer)) {
        return;
      }

      initializer.elements.forEach((element) => {
        if (!ts.isObjectLiteralExpression(element)) {
          return;
        }
        let typeValue: string | null = null;
        let schemaName: string | null = null;

        element.properties.forEach((prop) => {
          if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
            return;
          }
          if (prop.name.text === 'type' && ts.isStringLiteral(prop.initializer)) {
            typeValue = prop.initializer.text;
          }
          if (prop.name.text === 'schema' && ts.isIdentifier(prop.initializer)) {
            schemaName = prop.initializer.text;
          }
        });

        if (!typeValue || !schemaName) {
          return;
        }

        const schemaDecl = findSchemaDeclaration(sourceFile, schemaName);
        if (!schemaDecl || !schemaDecl.initializer) {
          throw new Error(
            `Missing schema declaration for ${schemaName} in ${path.basename(filePath)}`,
          );
        }

        const schemaText = schemaDecl.initializer.getText(sourceFile);
        definitions.push({
          type: typeValue,
          schemaName,
          schemaText,
        });
      });
    });
  });

  return definitions;
};

const strategyFiles = fs
  .readdirSync(strategiesDir)
  .filter((file) => file.endsWith('.strategy.ts'))
  .map((file) => path.resolve(strategiesDir, file));

const eventDefinitions: EventDefinition[] = [];
strategyFiles.forEach((filePath) => {
  eventDefinitions.push(...extractEventDefinitions(filePath));
});

const schemaMap = new Map<string, string>();
const events: { type: string; schemaName: string }[] = [];
eventDefinitions.forEach((definition) => {
  if (!schemaMap.has(definition.schemaName)) {
    schemaMap.set(definition.schemaName, definition.schemaText);
  }
  events.push({ type: definition.type, schemaName: definition.schemaName });
});

const lines: string[] = [];
lines.push("import { z } from 'zod';");
lines.push('');

schemaMap.forEach((schemaText, schemaName) => {
  lines.push(`export const ${schemaName} = ${schemaText};`);
  lines.push('');
});

lines.push('export const eventDefinitions = [');
events.forEach((event) => {
  lines.push(`  { type: '${event.type}', schema: ${event.schemaName} },`);
});
lines.push('] as const;');
lines.push('');
lines.push('export const eventSchemas = {');
events.forEach((event) => {
  lines.push(`  '${event.type}': ${event.schemaName},`);
});
lines.push('} as const;');
lines.push('');
lines.push('export type EventType = keyof typeof eventSchemas;');
lines.push('');
lines.push('export type EventPayloadMap = {');
lines.push('  [K in EventType]: z.infer<(typeof eventSchemas)[K]>;');
lines.push('};');
lines.push('');
lines.push('export type EventEnvelope<T extends EventType = EventType> = {');
lines.push('  id: string;');
lines.push('  ts: number;');
lines.push('  type: T;');
lines.push('  body: EventPayloadMap[T];');
lines.push('};');
lines.push('');
lines.push('export const parseEventPayload = <T extends EventType>(');
lines.push('  type: T,');
lines.push('  payload: unknown,');
lines.push('): EventPayloadMap[T] => eventSchemas[type].parse(payload);');
lines.push('');
lines.push('export const eventEnvelopeSchema = z.object({');
lines.push('  id: z.string(),');
lines.push('  ts: z.number(),');
lines.push('  type: z.string(),');
lines.push('  body: z.unknown(),');
lines.push('});');
lines.push('');
lines.push('export type RawEventEnvelope = z.infer<typeof eventEnvelopeSchema>;');
lines.push('');
lines.push('export const parseEventEnvelope = (payload: unknown): RawEventEnvelope =>');
lines.push('  eventEnvelopeSchema.parse(payload);');
lines.push('');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
console.log(`Generated ${path.relative(workspaceRoot, outputFile)}`);
