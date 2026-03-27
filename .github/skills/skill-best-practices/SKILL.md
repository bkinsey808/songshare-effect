---
name: skill-best-practices
description: >
    Guidance for writing SKILL.md files in this repository. Use when creating,
    updating, reviewing, or auditing a SKILL.md — including front matter,
    trigger design, sizing, output format, error handling, linking, safety,
    and composition. Do NOT use for general documentation questions unrelated
    to skill authoring.
user-invocable: true
---

**Requires:** file-read. No terminal or network access needed.

## When invoked

**Preconditions:**
- If reviewing or updating an existing skill, read that `SKILL.md` before
  proceeding.
- If no file path is given, apply the clarifying-question policy below.

**Clarifying questions:**
- **Defaults (proceed without asking):** assume the task is creating a new
  skill unless an existing path is mentioned or implied.
- **Always ask:** skill name and purpose if creating and not provided; file
  path if reviewing/updating and not provided. Ask one focused question at a
  time.
- State assumptions when proceeding: "Treating this as a new skill — let me
  know if you meant to review an existing one."

**Output format:**
- *Creating a new SKILL.md:* output the full file as a single fenced markdown
  code block, followed by a brief bullet list of any notable decisions made.
- *Reviewing an existing SKILL.md:* output a structured report with two
  sections — **Passes** (bullet list) and **Gaps** (table: item | issue |
  suggested fix). Keep it terse.
- *Updating an existing SKILL.md:* output only the changed sections as fenced
  code, with one sentence explaining each change.

**Error handling:**
- If a file path is needed but not given and cannot be inferred, ask for it
  before proceeding.
- If the specified file does not exist, stop and report: "File not found:
  [path]. Provide the correct path, or omit it to create a new skill."
- Do not guess or fabricate file content.

## Front matter

Only `name` and `description` are required and validated. Fields like
`title`, `owner`, and `tags` are **not** valid top-level frontmatter keys —
they cause validation errors. Document them in the skill body instead.

Supported top-level frontmatter keys: `name`, `description`, `argument-hint`,
`disable-model-invocation`, `license`, `user-invocable`.
(`compatibility` and `metadata` are valid keys but this project does not use them.)

- `name`: ≤64 chars, lowercase letters/numbers/hyphens — used for discovery.
- `description`: ≤1024 chars, third-person. Must state **when to use** and
  **when NOT to use** the skill. This is the primary invocation signal.
- `user-invocable: true`: exposes the skill as a slash command (e.g.
  `/my-skill`) so users can invoke it by name. Omit for skills that should
  fire transparently from context only.
- One frontmatter block only — a second `---` in the body renders as a
  horizontal rule, not a second frontmatter block.
- Keep front matter small (under 40 lines); use simple types.

See also: [Metadata & discovery](/docs/skill-best-practices.md#metadata-discovery)

```yaml
---
name: my-skill
description: >
    Generate X for Y. Use when the user asks to create or scaffold X.
    Do NOT use for Z or non-X tasks.
---
```

## Trigger design

The `description` field determines when the skill is invoked. Write it to
match user intent — not just what the skill does.

- **Over-triggering:** description too broad → skill fires for unrelated tasks,
  wastes context. Test with prompts that should _not_ invoke the skill.
- **Under-triggering:** description too vague → skill never fires. Include
  synonyms and alternative phrasings users might actually type.
- Add explicit exclusions (`Do NOT use for …`) when the boundary is
  non-obvious.

See also: [Invocation & trigger design](/docs/skill-best-practices.md#invocation-trigger)

## Sizing & context budget

- Target ≤200 lines; max ~300. Split into doc files beyond that.
- Move long examples, API refs, or datasets to separate files; instruct the
  agent to load them **on demand** (not eagerly).
- Total context cost = skill body + all loaded refs + conversation context.
  Rough heuristic: ~750 words ≈ 1 000 tokens ≈ one medium reference file.
  If a skill regularly loads >2–3 reference files, split into domain-specific
  skills.

See also: [Conciseness, scope & progressive disclosure](/docs/skill-best-practices.md#conciseness-scope)

## Structure & references

- One-level references only — avoid nested or chained file loads.
- Add a small TOC to any reference file >100 lines.
- Descriptive filenames: `reference/patterns.md`, `examples/usage.md`.

See also: [Structure, files & references](/docs/skill-best-practices.md#structure-files-references)

## Deep linking & anchors

Use explicit HTML anchors for stable deep-links:

```html
<a id="my-section"></a> ### My Section
```

Use root-relative links with fragments throughout all markdown files
(e.g. `/docs/skill-best-practices.md#my-section`). This format is consistent
regardless of where the linking file lives. VS Code's linter does not resolve
root-relative links — accept the warning; AI and human readers handle them
correctly.

See also: [Linking & anchors](/docs/skill-best-practices.md#linking-anchors)

## Output format & response style

Without explicit instructions, output format is one of the most common sources
of inconsistent skill behavior. Always specify:

- **Format:** prose, bullet list, fenced code block, JSON, table, or a named
  template.
- **Length:** "one paragraph", "≤10 bullets", "full file contents".
- **Headers:** "use `##` headings per section" or "no headers — flat prose".
- **Tone:** "terse and technical", "user-facing copy — no jargon".

See also: [Output format & response style](/docs/skill-best-practices.md#output-format)

## Error handling & fallback

Specify the failure contract explicitly — agents will otherwise silently guess.

- **Missing precondition:** stop and report what is missing; do not guess.
- **Partial failure:** specify abort-on-first-error vs. collect-all-errors.
- **Destructive operation:** output a summary of what _would_ change, then ask
  for confirmation before executing.
- **Optional tool unavailable:** provide a fallback path or stop gracefully.

See also: [Error handling & fallback patterns](/docs/skill-best-practices.md#error-handling)

## Precondition & context gathering

Agents don't automatically read files or check environment state. Be explicit:

- List required reads up front: "Before proceeding, read `src/schema.ts`."
- Specify env checks: "Verify `$DATABASE_URL` is set before running migrations."
- Specify repo-state checks: "Check `git status` — warn if uncommitted changes
  exist before modifying files."
- Fast-fail early: a skill that reads ten files then fails on a missing env var
  wastes context.

See also: [Precondition & context gathering](/docs/skill-best-practices.md#preconditions)

## Clarifying questions & defaults

- Define a **default assumption policy**: list what the agent should assume
  when information is absent so it can proceed without asking.
- Define a **must-ask threshold**: inputs so consequential the agent must ask
  (e.g., staging vs. production target).
- When asking, instruct the agent to ask **one focused question at a time**.
- Instruct the agent to state its assumption when proceeding: "Proceeding with
  X — let me know if you intended Y."

See also: [Clarifying questions & default assumptions](/docs/skill-best-practices.md#clarifying-questions)

## Safety & secrets

- **Never** embed API keys, tokens, passwords, or PII — even as placeholders.
  Use environment variable names as stand-ins: `$MY_API_KEY`.
- Sanitize all examples: no real usernames, emails, account IDs, or internal
  URLs.
- Treat skill files as public: they are version-controlled and repo-readable.
- Destructive operations: plan → dry-run/validate → explicit confirmation.
- Skills that modify shared state must be idempotent where possible; document
  non-idempotent steps clearly.

See also: [Safety, idempotency & secrets](/docs/skill-best-practices.md#safety-idempotency-secrets)

## Tool & permission declarations

Declare required tools near the top of the skill body (e.g. `**Requires:** file-read`).

- Apply least privilege: request only tools the skill genuinely needs.
- Mark optional tools as such and provide a fallback path.
- Add a confirmation gate for any step requiring elevated permissions.

See also: [Tool & permission declarations](/docs/skill-best-practices.md#tool-permission-declarations)

## Skill composition

Declare companion skills at the top of the body with a `**Depends on:**` line.

- Avoid circular references (skill A loads B, B loads A).
- Prefer one cohesive skill over a chain of micro-skills when tasks always
  appear together.
- Test combined invocations — cumulative token cost can exceed context limits.

See also: [Skill composition & dependencies](/docs/skill-best-practices.md#skill-composition)

## Maintenance

- Record breaking changes in a `## Changelog` section in the skill body;
  link the PR or commit. (`version` is not a supported frontmatter field.)
- Preserve old anchors when renaming headings to avoid silent broken links.
- Prune stale guidance — misleading agents is worse than missing coverage.
- Prefer backwards-compatible additions (new sections) over removals; add a
  `> **Moved:** see [section X](#anchor).` note when content relocates.
- When changing `skillId` or identifiers used by automation, update the
  automation config and document the change in the PR description.

See also: [Maintenance & change control](/docs/skill-best-practices.md#maintenance-change-control)

## Evaluations (I/O examples)

Informal test cases — run against the target model to verify behavior.

**Input:** "Create a new skill that generates Zod schemas from TypeScript types"
**Expected:** Agent asks for the skill name if not provided, then outputs a
fenced markdown SKILL.md block with valid frontmatter, `**Requires:**` declared,
output format defined, preconditions listed, and clarifying-question policy set.

**Input:** "Review my skill" (no path given)
**Expected:** Agent asks for the file path before proceeding.

**Input:** "Review `.github/skills/my-skill/SKILL.md`"
**Expected:** Agent reads the file, then outputs a structured Passes / Gaps
report. Does not modify the file without being asked.

**Input:** "What is the max length for the description field?"
**Expected:** Agent answers from the Front matter section without triggering a
full skill-review workflow.

**Input:** "Update the sizing section of `.github/skills/my-skill/SKILL.md`"
**Expected:** Agent reads the file, outputs only the updated section as fenced
code, explains the change in one sentence.

## Quick checklist (pre-release)

- [ ] `name` and `description` clear and conform to rules; trigger language tested
- [ ] `user-invocable` set correctly for the intended invocation mode
- [ ] `SKILL.md` body size reasonable (<300 lines for skill, <500 for full doc); context budget considered
- [ ] One-level references; long refs have TOC
- [ ] Output format explicitly specified
- [ ] Error handling and fallback behavior defined
- [ ] Preconditions listed; fast-fail instructions included
- [ ] Clarifying-question policy defined (defaults vs. must-ask)
- [ ] Templates, examples, gotchas present where useful
- [ ] Scripts provided for deterministic work; validators included
- [ ] Destructive operations have confirmation gates; skill is idempotent where possible
- [ ] No secrets, credentials, or PII in skill body or examples
- [ ] Tool/permission requirements declared
- [ ] Skill dependencies documented; no circular references
- [ ] Tests/evaluations created and run on target models

See also: [Quick checklist](/docs/skill-best-practices.md#quick-checklist)

## Gotchas

- A second `---` block in the body is **not** parsed as frontmatter — it
  renders as a horizontal rule and the YAML fields are ignored.
- `title`, `summary`, `owner`, `tags` are **not** valid top-level frontmatter
  keys — putting them in frontmatter causes a validation error. Document them
  in the body instead.
- Over-broad `description` → over-triggering. Vague `description` → skill
  never fires. Both are silent failures.
- Eager reference loading consumes context budget fast; always load on demand.
- VS Code's markdown linter does not resolve root-relative (`/docs/...`) links
  or fragment links (`file.md#anchor`) — both produce "unresolved" warnings.
  These are false positives; accept them. AI and human readers handle these
  correctly. Prefer root-relative links over traversal paths (`../../../`).
- `name` missing from frontmatter → skill may not be discoverable.
- Missing output format instruction → inconsistent agent output format across
  invocations.
- No clarifying-question policy → agent either over-asks or silently assumes
  wrong values.

See also: [Anti-patterns](/docs/skill-best-practices.md#anti-patterns), [Debugging](/docs/skill-best-practices.md#debugging)

## References

- [docs/skill-best-practices.md](/docs/skill-best-practices.md)
  — full reference with sources (20 sections; load on demand)
- [CommonMark spec](https://spec.commonmark.org/)
- [WHATWG HTML — fragment identifiers](https://html.spec.whatwg.org/multipage/browsing-the-web.html#fragment-identifiers)
- [GitHub — linking to headings](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/linking-to-headings)
