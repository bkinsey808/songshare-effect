---
name: form-patterns
description: Project-specific form patterns using useAppForm, createFormSubmitHandler, and createApiResponseHandlerEffect. Use when building or editing any form with validation, submission, or API response handling in React.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# Form Patterns Skill

## Use When

Use this skill when:

- Building or modifying form validation/submission behavior in React.
- Wiring API response handling through `useAppForm` and Effect helpers.

Execution workflow:

1. Use `useAppForm` as the primary form abstraction.
2. Keep schema validation and submission flow typed and effect-driven.
3. Reuse shared response/error handling helpers instead of ad-hoc form logic.
4. Validate with targeted form tests, then `npm run lint`.

Output requirements:

- Summarize form flow changes (validation, submit, response handling).
- Note user-visible error-handling behavior changes.

All forms in this project use `useAppForm` from `@/react/lib/form/useAppForm`. Do not reach for raw React state + `onSubmit` — the project has typed Effect/validation plumbing you must use.

## `useAppForm` Hook

```typescript
import useAppForm from "@/react/lib/form/useAppForm";
import { Effect } from "effect";
import { useRef } from "react";
import { MyFormSchema } from "./myFormSchema"; // Effect Schema

function MyForm(): ReactElement {
	const formRef = useRef<HTMLFormElement>(null);
	const {
		validationErrors,
		isSubmitting,
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		handleApiResponseEffect,
		reset,
	} = useAppForm({
		schema: MyFormSchema,
		formRef,
		defaultErrorMessage: "Something went wrong. Please try again.",
	});
	// ...
}
```

### Props

| Prop                  | Type                               | Required | Description                     |
| --------------------- | ---------------------------------- | -------- | ------------------------------- |
| `schema`              | `Schema.Schema<FormValues>`        | ✅       | Effect Schema for validation    |
| `formRef`             | `React.RefObject<HTMLFormElement>` | ✅       | Ref to the `<form>` element     |
| `defaultErrorMessage` | `string`                           | optional | Fallback for generic API errors |
| `initialValues`       | `Partial<FormValues>`              | optional | Values used by `reset()`        |

## Handling Submission

`handleSubmit` returns an `Effect.Effect<void>`. Run it with `Effect.runFork` or `Effect.runPromise`:

```typescript
function handleFormSubmit(formData: Record<string, unknown>): void {
  Effect.runFork(
    handleSubmit(formData, async (validatedData) => {
      const response = await fetch("/api/songs", {
        method: "POST",
        body: JSON.stringify(validatedData),
      });
      await Effect.runPromise(
        handleApiResponseEffect(response, setSubmitError),
      );
    }),
  );
}

// Wire to the <form>:
<form
  ref={formRef}
  onSubmit={(e) => {
    e.preventDefault();
    handleFormSubmit(Object.fromEntries(new FormData(e.currentTarget)));
  }}
>
```

`handleSubmit` automatically:

- Validates with the Effect Schema
- Sets `isSubmitting = true` while running
- Populates `validationErrors` on failure
- Calls `onSubmit(validatedData)` on success

## Field Blur Validation

Validate individual fields as the user leaves them:

```typescript
<input
  name="title"
  ref={titleRef}
  onBlur={() => handleFieldBlur("title", titleRef)}
/>
{getFieldError("title") && (
  <p>{getFieldError("title")?.message}</p>
)}
```

## API Response Handling

`handleApiResponseEffect` maps API responses to form errors:

```typescript
const success = await Effect.runPromise(handleApiResponseEffect(response, setSubmitError));
// success === true → API returned OK
// success === false → ApiResponseAction already dispatched (field error or general error)
```

The API must return one of these JSON error shapes for field/general errors to be routed correctly:

```json
{ "type": "setFieldError",   "field": "email", "message": "Already in use" }
{ "type": "setGeneralError", "message": "Server error" }
```

## Defining a Form Schema

Use Effect Schema in a colocated `<feature>FormSchema.ts` file:

```typescript
// react/src/song/SongFormSchema.ts
import { Schema } from "effect";

export const SongFormSchema = Schema.Struct({
	title: Schema.String.pipe(Schema.minLength(1)),
	artist: Schema.String.pipe(Schema.minLength(1)),
});

export type SongFormValues = Schema.Schema.Type<typeof SongFormSchema>;
```

## Do Not

- ❌ Use raw `useState` for validation errors in forms — use `useAppForm`
- ❌ Call `e.target.value` directly in submit handlers — read from `FormData` or the schema-validated object
- ❌ Write `try/catch` for form validation — `handleSubmit` handles it
- ❌ Mix `useAppForm` with React Hook Form or other form libraries

## References

- Effect Schema: [../effect-ts-patterns/SKILL.md](/.github/skills/effect-ts-patterns/SKILL.md)
- Source: `@/react/lib/form/useAppForm.ts`

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If form logic includes Effect-style response handling, also load `effect-ts-patterns`.
- If the form sits in React-heavy component work, also load `react-conventions`.
