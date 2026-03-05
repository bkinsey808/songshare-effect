# File Splitting Reference

This document provides the detailed checklist for larger file-splitting refactors.

## Planning

1. Inventory exports in the source file.
2. Map dependencies between symbols before extraction.
3. Choose target layout:
- single folder for cohesive helpers
- colocated placement near domain consumers

## Extraction Pattern

1. Move one symbol at a time.
2. Preserve JSDoc and function behavior.
3. Prefer default export for one-primary-symbol files.
4. Keep helper modules free of module-level side effects.

## Imports

- Update all consumers immediately after each extraction.
- Prefer absolute aliases (`@/react/...`, `@/api/...`, `@/shared/...`) for reusable helper modules.
- Avoid introducing barrel files.

## Testing

- Create/maintain colocated tests per extracted module.
- For test helper extraction, add lightweight tests for callable setup functions.
- Validate behavior parity before deleting old files.

## Validation Commands

```bash
npm run test:unit -- path/to/changed.test.ts
npx tsc -b .
npm run lint
```

## Troubleshooting

- Missing mock behavior after split: ensure setup order is unchanged.
- Circular helper imports: convert shared state to getter-based access.
- Broken imports after move: run targeted search for old import paths and update all references.
