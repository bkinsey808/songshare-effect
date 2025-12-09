/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/strict-boolean-expressions */
import { writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { convertEffectAstToJsonSchema } from './lib/astToJsonSchema';

// Type-safe Bun runner for generating OpenAPI-ish contract from Effect schemas
// This is a TS version of the previous .mjs generator so we can run it under Bun
// and have proper static typing for sanity.

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// The registry will be in dist/shared after a project-wide build (tsc -b)
// from the repo root this resolves to `dist/shared/src/schemas/registry.js`.
// Prefer compiled dist entry, but fall back to the TS source when a compiled
// JS file is not present (this keeps the generator usable in developer
// environments where `shared` emits declarations only).
const registryDefaultPath = path.join(__dirname, '..', 'dist', 'shared', 'src', 'schemas', 'registry.js');
const registryFallbackSource = path.join(__dirname, '..', 'shared', 'src', 'schemas', 'registry.ts');

type ApiEndpoint = {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  requestSchema?: unknown;
  responseSchema?: unknown;
  summary?: string;
};

const JSON_INDENT = 2;
const EXIT_CODE_FAILURE = 1;
const EXIT_CODE_SUCCESS = 0;
const MIN_NAME_LENGTH = 1;

async function main() {
  try {
    // Resolve which registry implementation to import. Prefer compiled dist,
    // but fall back to the source file in development environments.
    let registryPath = registryDefaultPath;
    if (!existsSync(registryPath) && existsSync(registryFallbackSource)) {
      registryPath = registryFallbackSource;
    }

    // Import the registry (Esm)
    const importedModule: unknown = await import(pathToFileURL(registryPath).href);

    if (!importedModule || typeof importedModule !== 'object') {
      throw new TypeError('Imported module invalid');
    }

    // Pull ApiSchemaRegistry property if present and ensure it's an array
    // We don't rely on unsafe any here — we will guard at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const potential = (importedModule as any).ApiSchemaRegistry;
    if (!Array.isArray(potential)) {
      throw new TypeError('ApiSchemaRegistry not found or invalid in dist output');
    }

    const apiRegistry = potential as ApiEndpoint[];

    const components: { effectSchemas: Record<string, unknown> } = { effectSchemas: {} };

    const paths: Record<string, Record<string, { summary?: string; requestSchema?: unknown; responseSchema?: unknown }>> = {};

    for (const ep of apiRegistry) {
      // Narrow with runtime checks
      if (typeof ep.path === 'string' && typeof ep.method === 'string') {
        const pathKey = ep.path;
        const method = String(ep.method).toLowerCase();

        const request = ep.requestSchema === undefined ? undefined : safeDumpSchema(ep.requestSchema);
        const response = ep.responseSchema === undefined ? undefined : safeDumpSchema(ep.responseSchema);

        // No debug logs in normal runs — we rely on a deterministic output file.

        const rawRequestName = getSchemaName(ep.requestSchema);
        if (request !== undefined) {
          const base = (typeof rawRequestName === 'string' && rawRequestName.length >= MIN_NAME_LENGTH)
            ? rawRequestName
            : `${pathKey}_${method}_request`;
          const name = `Request_${sanitizeName(base)}`;
          components.effectSchemas[name] = request;
        }

        const rawResponseName = getSchemaName(ep.responseSchema);
        if (response !== undefined) {
          const base = (typeof rawResponseName === 'string' && rawResponseName.length >= MIN_NAME_LENGTH)
            ? rawResponseName
            : `${pathKey}_${method}_response`;
          const name = `Response_${sanitizeName(base)}`;
          components.effectSchemas[name] = response;
        }

        paths[pathKey] = paths[pathKey] ?? {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const entry: { summary?: string; requestSchema?: unknown; responseSchema?: unknown } = {};
        if (ep.summary !== undefined) { entry.summary = ep.summary; }
        if (request !== undefined) { entry.requestSchema = request; }
        if (response !== undefined) { entry.responseSchema = response; }
        paths[pathKey][method] = entry;
      }
    }

    const openApiDoc = {
      openapi: '3.0.0',
      info: {
        title: 'SongShare Effect — generated contract (Effect schemas AST)',
        version: '0.0.0',
        description:
          'This generated file is produced from Effect-TS schemas. The Effect schema AST is embedded under components.effectSchemas.\nUse this as a deterministic contract and for experimentation — the next step is to map Effect AST -> JSON Schema.',
      },
      paths,
      components,
      generatedAt: new Date().toISOString(),
    } as const;

    // Write the generated contract into the shared package so it's available
    // to other consumers of the repo (frontend, docs, generator tooling).
    const outPath = path.join(__dirname, '..', 'shared', 'src', 'generated', 'openapi.json');
    writeFileSync(outPath, `${JSON.stringify(openApiDoc, undefined, JSON_INDENT)}\n`, 'utf8');

    console.warn(`Generated ${outPath}`);
    return EXIT_CODE_SUCCESS;
  } catch (error) {
    // Log and exit non-zero so CI can detect failures.
    // eslint-disable-next-line no-console
    console.error('OpenAPI generation failed:', error);
    return EXIT_CODE_FAILURE;
  }
}

// Convert a properties-like portion of an Effect AST into JSON Schema props + req list
// effectAstProcessProps and convertEffectAstToJsonSchema are implemented in scripts/lib/astToJsonSchema.ts and imported above.

// run
if (import.meta.main) {
  // Use top-level await to prefer await rather than .then chains
  const code = await main();
  if (code !== EXIT_CODE_SUCCESS) {
    // eslint-disable-next-line no-process-exit
    process.exit(code);
  }
}

// Helper to call toJSON() on Effect Schema instances safely
function safeDumpSchema(schema: unknown): unknown {
  try {
    // Many Effect schemas are functions/objects that either expose a
    // `toJSON` method or carry an `ast` property describing the schema.
    // Prefer `toJSON` when present (older ASTs), otherwise fall back to
    // `ast` for runtime Schema instances.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (schema !== undefined && schema !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schemaObj = schema as any;
      if (typeof schemaObj.toJSON === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ast = schemaObj.toJSON();
        try {
          return convertEffectAstToJsonSchema(ast);
        } catch {
          return ast;
        }
      }

      if (schemaObj && schemaObj['ast'] !== undefined) {
        try {
          return convertEffectAstToJsonSchema(schemaObj['ast']);
        } catch {
          return schemaObj['ast'];
        }
      }
    }

    // Fallback: return the schema object as-is (deterministic)
    return schema;
  } catch (error) {
    return { error: String(error) };
  }
}

// Conservative mapping from Effect-TS schema AST to a lightweight JSON Schema.
// This mapping is intentionally best-effort: it handles common cases like
// primitives, arrays, objects/structs and records. For unfamiliar shapes the
// function will embed the original AST under `x_effect_ast` so tooling can
// still inspect the rich form if needed.
// The converter lives in scripts/lib/astToJsonSchema.ts — import above instead

function getSchemaName(maybeSchema: unknown): string | undefined {
  if (!maybeSchema || typeof maybeSchema !== 'object') {
    return undefined;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nm = (maybeSchema as any).name;
    if (typeof nm === 'string') {
      return nm;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function sanitizeName(name: string): string {
  return String(name).replaceAll(/[^a-z0-9]/gi, '_');
}
