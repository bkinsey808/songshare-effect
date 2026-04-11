---
name: doc-best-practices
description: >
  Documentation standards for this project — file naming, structure, writing
  style, formatting, skill+doc pairs, placement, and maintenance. Use when
  creating, updating, reviewing, or auditing any Markdown doc in `/docs/`,
  `README.md`, or `CONTRIBUTING.md`. Also use when deciding whether a new
  topic needs a doc, a skill, or both. Do NOT use for in-code JSDoc/TSDoc
  comments — load code-comment-best-practices instead.
user-invocable: true
---

**Requires:** file-read. No terminal needed unless validating after edits.

## Full reference

[docs/doc-best-practices.md](/docs/doc-best-practices.md) — load on demand for
full formatting rules, ✅/❌ examples, rationale, and edge cases.

## When invoked

**Preconditions:**
- Read the target file before modifying it.
- Check `docs/ai/rules.md` for repo-wide constraints before proceeding.

**Clarifying questions:**
- **Defaults (proceed without asking):** assume the task is creating a new doc
  unless an existing path is mentioned or implied; place new docs in `/docs/`
  unless context suggests README or CONTRIBUTING.
- **Always ask:** topic and purpose if creating and not provided; file path if
  reviewing/updating and not provided. Ask one focused question at a time.
- State assumptions when proceeding: "Creating a new doc in `/docs/` — let me
  know if you meant to update an existing one."

**Output format:**
- *Creating a doc:* output the full file as a single fenced Markdown block,
  followed by a brief bullet list of notable decisions.
- *Reviewing a doc:* output a structured report — **Passes** (bullet list) and
  **Gaps** (table: item | issue | suggested fix). Keep it terse.
- *Updating a doc:* output only the changed sections as fenced code with one
  sentence explaining each change.
- *Question-answering:* concise prose referencing the relevant doc section.

**Error handling:**
- If the file path is needed but not given and cannot be inferred, ask for it
  before proceeding.
- If the specified file does not exist, stop and report: "File not found:
  [path]."
- Do not fabricate file contents.

## Quick decision trees

**Should I create new documentation?**

```
Does this concept require more than 3 paragraphs of explanation?
├─ No  → Add to an existing doc or inline code comments
└─ Yes → Is it a standalone topic?
    ├─ No  → Expand existing doc with a new section
    └─ Yes → Create a new doc
```

**Where does this doc live?**

```
├─ General project info (setup, contributing) → Root README.md
├─ Coding standards & patterns               → /docs/*-best-practices.md
├─ Feature or architecture deep dive         → /docs/[feature-name].md
├─ Code-level implementation details         → Inline JSDoc/TSDoc comments
└─ Skill definitions for AI agents           → /skills/[name]/SKILL.md
```

**Do I need a skill too?**

```
Is this a recurring task with clear patterns?
├─ No  → Doc only is fine
└─ Yes → Will AI agents perform this task?
    ├─ No  → Doc only
    └─ Yes → Create both
        ├─ Write the doc first (comprehensive reference)
        └─ Then write the skill (concise, with deep links to the doc)
```

**Details:** [skill-and-doc-pairing](/docs/doc-best-practices.md#skill-and-doc-pairing)

## Quick rules

### File naming

- Lowercase with hyphens: `doc-best-practices.md` ✅
- No underscores, dots, or PascalCase: `DocBestPractices.md` ❌

**Details:** [file-naming](/docs/doc-best-practices.md#file-naming)

### Required structure

Every doc must have:

1. **H1 title** — one per document, at the top
2. **Brief intro** — 1–3 sentences: what is this, who should read it
3. **Table of Contents** — for docs >~150 lines or with 3+ sections
4. **Explicit `<a id="...">` anchors** — for every heading in the ToC
5. **`## See Also`** — at the bottom, linking to related docs (optional but preferred)

**Details:** [required-elements](/docs/doc-best-practices.md#required-elements), [anchor-links](/docs/doc-best-practices.md#anchor-links)

### Formatting essentials

- **Headers:** ATX style (`#`), Title Case, one blank line before/after,
  unique names across the whole document
- **Lists:** hyphens (`-`), 4-space indent for nesting, `1.` for ordered
- **Code blocks:** always fenced with language specifier (` ```typescript `)
- **Section separators:** `---` between major H2 sections only
- **Line length:** target 80–100 chars for prose; skip for URLs, tables, code

**Details:** [formatting-standards](/docs/doc-best-practices.md#formatting-standards)

### Writing style

- Active voice; short sentences (<25 words preferred)
- Audience: competent developer, new to this project
- Explain the "why" when rules might seem arbitrary
- Use decision trees for multi-path choices
- Start with the common case, cover edge cases later (progressive disclosure)

**Details:** [writing-style](/docs/doc-best-practices.md#writing-style)

### Links

- Internal: relative paths (`react-best-practices.md`, `../README.md`)
- External: absolute URLs with descriptive anchor text (not "click here")
- Section links: `[Section Title](#anchor-id)` using explicit `<a id>` anchors

**Details:** [links-and-references](/docs/doc-best-practices.md#links-and-references)

## Skill+doc pairs in this project

| Skill                           | Doc                                  |
| ------------------------------- | ------------------------------------ |
| `unit-test-best-practices`      | `unit-test-best-practices.md`        |
| `unit-test-hook-best-practices` | `unit-test-hook-best-practices.md`   |
| `react-best-practices`          | `react-best-practices.md`            |
| `typescript-best-practices`     | `typescript-best-practices.md`       |
| `zustand-best-practices`        | `zustand-best-practices.md`          |
| `code-comment-best-practices`   | `code-comment-best-practices.md`     |
| `lint-first-authoring`          | `lint-best-practices.md`             |
| `playwright-testing`            | `playwright-best-practices.md`       |
| `authentication-system`         | `authentication-system.md`           |
| `effect-ts-patterns`            | `effect-implementation.md`           |
| `deployment-strategies`         | `devops/deploy.md`                   |
| `internationalization`          | `internationalization-system.md`     |
| `skill-best-practices`          | `skill-best-practices.md`            |
| `doc-best-practices`            | `doc-best-practices.md`              |

## Validation checklist

- [ ] Filename kebab-case, no underscores
- [ ] H1 title present; exactly one per file
- [ ] Brief intro (1–3 sentences) immediately after H1
- [ ] ToC present (if >~150 lines or 3+ sections)
- [ ] `<a id="...">` anchors match all ToC entries
- [ ] ATX headers, Title Case, no skipped levels
- [ ] Code blocks fenced with language specifier
- [ ] No broken internal links
- [ ] `## See Also` at bottom with links to related docs

## Evaluations (I/O examples)

**Input:** "Create a doc for the Hono API patterns in this project"
**Expected:** Agent places draft in `/docs/server/hono-best-practices.md`, includes H1,
intro, ToC with anchors, formatted with hyphens/ATX/fenced code, ends with
See Also. Notes that a companion skill already exists at `skills/hono-best-practices/SKILL.md`.

**Input:** "Review `docs/devops/deploy.md` for standards compliance"
**Expected:** Agent reads the file, outputs **Passes** / **Gaps** report without
modifying anything.

**Input:** "Should I put this in a skill or a doc?"
**Expected:** Agent walks through the decision tree above and gives a
context-specific recommendation.

**Input:** "Add a new section to `docs/lint-best-practices.md`"
**Expected:** Agent reads the file, outputs only the new section as fenced code,
explains the addition in one sentence.

## References

- [docs/doc-best-practices.md](/docs/doc-best-practices.md) — full reference (load on demand)
- [docs/skill-best-practices.md](/docs/skill-best-practices.md) — for authoring skill files
- [skills/skill-best-practices/SKILL.md](/skills/skill-best-practices/SKILL.md)
