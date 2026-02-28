# Supabase / Postgrest Mocking (tests)

This short reference shows the recommended pattern for mocking Supabase/Postgrest responses in unit tests.

Why: many helpers in the repo expect the `PostgrestResponse<T>` shape. Returning bare `{ data: [...] }` objects in mocks can trigger TypeScript and lint errors across many tests. Centralizing the minimal response construction in a single test helper keeps tests readable and lint-clean.

Helper

- Path: `react/src/lib/test-utils/asPostgrestResponse.ts`
- Purpose: construct a minimal `PostgrestResponse<T>` for test mocks and contain the localized linter/`oxlint` disables.

Usage

```ts
import callSelect from '@/react/lib/supabase/client/safe-query/callSelect';
import asPostgrestResponse from '@/react/lib/test-utils/asPostgrestResponse';

vi.mock('@/react/lib/supabase/client/safe-query/callSelect');
const mockedCallSelect = vi.mocked(callSelect);

// Return a minimal success response for a query that returns rows
mockedCallSelect.mockResolvedValue(asPostgrestResponse({ data: [{ id: 'r1' }] }));

// You can also include error/count/status if you need to emulate other outcomes
mockedCallSelect.mockResolvedValue(
  asPostgrestResponse({ data: [], error: null, count: null, status: 200, statusText: 'OK' }),
);
```

Guidelines

- Prefer `vi.mocked(callSelect)` (typed mocked helper) rather than casting to `any`.
- Avoid sprinkling `// oxlint-disable` around test files; keep any necessary disables centralized inside `asPostgrestResponse`.
- If you need a narrow unsafe cast in a test, move it into a test util (not inline in many tests).
- For complex mock factories, provide a typed helper that returns the mocked function (so test files stay lint-clean).

If you want, I can add a short example of the actual `asPostgrestResponse` implementation to this page as well.
