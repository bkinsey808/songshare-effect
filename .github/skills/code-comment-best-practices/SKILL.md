---
name: code-comment-best-practices
description: >
  Code comment conventions for TypeScript/React — JSDoc vs inline, when to
  explain why vs what, params/returns rules, spacing, placement, test comment
  rules, links in comments (@see vs {@link}), TODO/FIXME format, anti-patterns,
  writing style. Use when adding, updating, or reviewing comments in .ts or
  .tsx files. Do NOT use for general documentation questions unrelated to
  in-code comments.
---

**Requires:** file-read. No terminal needed unless validating after edits.

**Depends on:** [`typescript-best-practices/SKILL.md`](/.github/skills/typescript-best-practices/SKILL.md) — load when comment changes are driven by API clarity or type changes.

## Full reference

[docs/code-comment-best-practices.md](/docs/code-comment-best-practices.md) — load on demand for
detailed formatting patterns, examples, and edge cases.

## When invoked

**Preconditions:**
- Read the file being commented before making changes.
- Check `.agent/rules.md` for repo-wide constraints.

**Clarifying questions:**
- **Defaults (proceed without asking):** add/update comments in the file already open; follow all rules below.
- **Always ask:** which file if not specified.

**Output format:**
- Write changes directly; after edits output a brief bullet list of what was added/changed and why.
- For question-answering: concise prose with inline code, referencing the relevant doc section.

**Error handling:**
- If lint or tsc fails after comment edits, report verbatim and fix before declaring success.

## Quick rules

Core philosophy: explain the "why," not the "what." ([philosophy](/docs/code-comment-best-practices.md#1-philosophy))

- **JSDoc (`/** */`)** for exported functions, components, and types. ([when to use](/docs/code-comment-best-practices.md#jsdoc-when))
- **Default to JSDoc for named functions you add** — not just exports. Helper functions, local utility functions, test helpers, and hook-internal handlers should usually get concise JSDoc unless the name and body are truly trivial. This repo prefers documenting function purpose proactively rather than only at module boundaries.
- **`//`** for logic blocks (`useEffect`, complex conditionals), test descriptions, and grouped constants. ([inline comments](/docs/code-comment-best-practices.md#inline-comments))
- **No types in JSDoc** — TypeScript provides them. Use `@param name - description` only. ([formatting](/docs/code-comment-best-practices.md#jsdoc-formatting))
- **Always `@returns`** — write `@returns void` for void functions. ([params & returns](/docs/code-comment-best-practices.md#jsdoc-params-returns))
- **Props: document fields directly** — no `@param props` wrapper; list each destructured field. ([params & returns](/docs/code-comment-best-practices.md#jsdoc-params-returns))
- **Multi-line JSDoc:** `/**` and `*/` each on their own line. ([formatting](/docs/code-comment-best-practices.md#jsdoc-formatting))
- **One blank line above** a JSDoc block; no blank lines between JSDoc and its symbol. ([spacing & placement](/docs/code-comment-best-practices.md#spacing-placement))
- **No JSDoc above `describe`/`it`/`test`** — use `//` only when the name isn't self-explanatory. ([test comments](/docs/code-comment-best-practices.md#test-comments))
- **Grouped constants** — use `//` above the group, not JSDoc spanning multiple symbols. ([constants](/docs/code-comment-best-practices.md#constants))
- **Max 100 chars per line.** ([formatting](/docs/code-comment-best-practices.md#jsdoc-formatting))
- **JSDoc for any comment with a URL** — use `@see` for standalone links (URLs, file paths), `{@link}` for inline symbol refs; never `//` for comments containing links. ([links in comments](/docs/code-comment-best-practices.md#links-in-comments))
- **TODO/FIXME must include context** — `// TODO: [action] — [reason or ticket]`; switch to JSDoc when the comment includes a link. ([inline comments](/docs/code-comment-best-practices.md#inline-comments))
- **No redundant comments** — don't comment obvious code, don't repeat types, don't apologize for messy code (refactor instead). ([what not to comment](/docs/code-comment-best-practices.md#what-not-to-comment))
- **Writing style** — full sentences + periods for JSDoc; fragments ok for `//`; active voice; present tense; one space after `//`. ([writing style](/docs/code-comment-best-practices.md#writing-style))
- **Anti-patterns** — no commented-out code, no version history, no author attribution, no jokes or passive-aggressive remarks. ([anti-patterns](/docs/code-comment-best-practices.md#anti-patterns))

## Validation

```bash
npm run lint
```

## Do not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not change logic — comments only.
- Do not add types in JSDoc for `.ts`/`.tsx` files.
- Do not expand scope beyond the requested task without calling it out.

## Skill handoffs

- For TypeScript API clarity issues, also load `typescript-best-practices`.
- For React hook or component comments, also load `react-best-practices`.

## Evaluations (I/O examples)

**Input:** "Add JSDoc to all exported functions in `src/utils/format.ts`"
**Expected:** Agent reads the file, adds JSDoc with correct param/returns rules (no types, destructured props, `@returns void` where applicable), runs lint + tsc, reports what was added.

**Input:** "How should I comment a `useEffect` block?"
**Expected:** Agent answers in prose: use `//` above the `useEffect`, explain the why not the what, never on the same line. References [§6 of the doc](/docs/code-comment-best-practices.md#inline-comments).

**Input:** "Add comments" (no file specified)
**Expected:** Agent asks which file before proceeding.
