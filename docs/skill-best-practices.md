# Skills Best Practices — organized guidance

## Purpose

This file consolidates skill-authoring guidance from multiple sources (Agent
Skills, Claude/Anthropic, CommonMark, WHATWG, GitHub) and groups related
recommendations so authors can quickly find practical rules, examples, and
authoritative links.

## Summary (quick checklist)

- Keep `SKILL.md` concise and focused (prefer < 500 lines; aim much smaller).
- Put only metadata in frontmatter; keep long prose in body or separate files.
- Write `description` to match user intents that should trigger the skill —
  include synonyms and explicit exclusions.
- Use progressive disclosure: split long references into `references/` and
  instruct the agent when to load them.
- Prefer explicit anchors and traversal paths when SKILLs are in subfolders.
- Provide templates, examples, workflows, and validator scripts for critical
  or destructive tasks.
- Declare required tools; never embed secrets; gate destructive operations.
- Define expected I/O before writing the skill (eval-driven development).
- Instruct the agent on output format, error fallbacks, and when to ask vs.
  assume.

<!-- Table of contents (generated) -->

<a id="toc"></a>

## Table of contents

- [Metadata & discovery](#metadata-discovery)
- [Invocation & trigger design](#invocation-trigger)
- [Conciseness, scope & progressive disclosure](#conciseness-scope)
- [Structure, files & references](#structure-files-references)
- [Linking & anchors](#linking-anchors)
- [Examples, templates & patterns](#examples-templates)
- [Scripts, execution & runtime](#scripts-execution-runtime)
- [Safety, idempotency & secrets](#safety-idempotency-secrets)
- [Tool & permission declarations](#tool-permission-declarations)
- [Testing, evaluation & iteration](#testing-evaluation)
- [Maintenance & change control](#maintenance-change-control)
- [Skill composition & dependencies](#skill-composition)
- [Output format & response style](#output-format)
- [Error handling & fallback patterns](#error-handling)
- [Precondition & context gathering](#preconditions)
- [Clarifying questions & default assumptions](#clarifying-questions)
- [Anti-patterns](#anti-patterns)
- [Debugging a poorly-behaving skill](#debugging)
- [Quick checklist (pre-release)](#quick-checklist)
- [Sources](#sources)

<a id="metadata-discovery"></a>

### 1) Metadata & discovery

- Keep YAML frontmatter minimal. The only required and validated top-level
  fields for VS Code agent skills are `name` and `description`. Other optional
  supported fields: `argument-hint`, `disable-model-invocation`, `license`,
  `user-invocable`. (`compatibility` and `metadata` are valid keys but this
  project does not use them.) Fields like `title`, `owner`, and
  `tags` are **not** valid top-level frontmatter keys — document them in the
  skill body instead (e.g., an `## About` section).
    - `name`: <=64 chars, lowercase letters/numbers/hyphens, no XML, avoid
      reserved words — used for discovery.
    - `description`: non-empty, <=1024 chars, third-person, include when to use
      the Skill (triggers) and when NOT to use it.
- **`user-invocable: true`:** makes the skill available as a slash command
  (e.g., `/my-skill`) so users can trigger it directly by name. Without this
  flag the skill is only invoked automatically when the agent matches it from
  context. Use `user-invocable` for workflows users will consciously initiate;
  omit it for skills that should fire transparently in the background.
- **Start from real expertise:** write skills around tasks you have already
  performed manually and know well. Skills distilled from real workflows
  produce more reliable agent behavior than skills written speculatively. If
  you haven't done the task yourself, prototype it manually first, then encode
  the working steps.
- Use clear naming patterns (gerund/action or descriptive verb forms). Avoid
  vague names like `utils` or `helper`.

Sources: [Claude — Skill structure](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Skill%20structure), [Agent Skills — Best practices](https://agentskills.io/skill-creation/best-practices#:~:text=Start%20from%20real%20expertise).

<a id="invocation-trigger"></a>

### 2) Invocation & trigger design

- The `description` field is the primary signal an agent uses to decide
  whether to invoke this skill. Write it to match the user intents or task
  types that should trigger the skill — not just what the skill does.
- Avoid over-triggering: if the description is too broad the skill fires for
  unrelated tasks and wastes context. Test with prompts that should _not_
  invoke the skill.
- Avoid under-triggering: if the description is too narrow or vague the skill
  is never selected. Include synonyms and alternative phrasings the user might
  actually type.
- Describe when _not_ to use the skill (exclusions) when the boundary is
  non-obvious — this helps the agent route correctly.
- Use action-oriented, third-person phrasing:
  "Use when the user asks to generate X" or "Invoke when writing or fixing Y."

Example description with effective trigger language:

```yaml
description: >
    Generate Effect Schema validators from TypeScript types. Use when the user
    asks to add or update runtime validation for an existing type. Do NOT use
    for Supabase RLS policies or non-Effect-Schema validation.
```

Sources: [Agent Skills — description & triggers](https://agentskills.io/skill-creation/best-practices#:~:text=description), [Claude — skill discovery](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=discovery).

<a id="conciseness-scope"></a>

### 3) Conciseness, scope & progressive disclosure

- Be concise: include only tokens the agent truly needs. Assume the model
  already knows common concepts.
- Scope Skills like functions: neither too narrow nor too broad. For large
  domains split by domain (see pattern: domain-specific organization).
- Progressive disclosure: keep `SKILL.md` under ~500 lines (Claude/AgentSkills
  guidance). Move long examples, API references, or datasets into separate
  files and instruct when to load them (on-demand).
- **Context budget:** reason about total token cost — `SKILL.md` body + all
  loaded reference files + ongoing conversation context. Large skills reduce
  the context available for actual work. If a skill regularly loads >2–3
  reference files, consider splitting it into domain-specific skills.
  Rough heuristic: ~750 words ≈ 1 000 tokens ≈ one medium reference file.
  A 500-line skill with two loaded references can easily consume 4–6 k tokens
  before any user message is processed.
- Avoid loading reference files eagerly; instruct the agent to load them only
  when the specific sub-topic is needed.

Sources: [Claude — "Concise is key"](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Concise%20is%20key), [Agent Skills — "Progressive disclosure"](https://agentskills.io/skill-creation/best-practices#:~:text=progressive%20disclosure), [Agent Skills — spending context wisely](https://agentskills.io/skill-creation/best-practices#:~:text=Spending%20context%20wisely).

<a id="structure-files-references"></a>

### 4) Structure, files & references

- Organize files for discovery: descriptive filenames and forward-slash paths
  (e.g., `reference/finance.md`, `examples/commit-messages.md`).
- Keep references one level deep from `SKILL.md` — avoid nested references
  that require the agent to chase multiple files.
- For long reference files (>100 lines) include a small TOC so partial reads
  reveal structure.
- Add a TOC for any referenced doc with many sections or over ~300 lines; place
  it near the top and keep it concise (top-level headings only).
- If using a manual TOC, link to explicit anchors (more stable than generated
  slugs), and preserve old anchors when renaming headings to avoid broken links.

Sources: [Claude — one-level references & TOC guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=one%20level%20deep), [Agent Skills — bundling & organization](https://agentskills.io/skill-creation/best-practices#:~:text=bundling%20additional%20reference%20files).

<a id="linking-anchors"></a>

### 5) Linking & anchors

- **Use root-relative links with fragments** for all markdown files, regardless
  of where the linking file lives (example: `/docs/operational-guides.md#api-errors`).
- Root-relative links (starting with `/`) are consistent — they work the same
  whether the linking file is at the repo root or nested three levels deep in
  `skills/`. No traversal arithmetic needed.
- **GitHub resolves root-relative links from the repository root.** Per GitHub's
  official documentation: "Links starting with `/` will be relative to the
  repository root." A link like `/docs/bar.md` in any nested file correctly
  resolves to `github.com/owner/repo/blob/main/docs/bar.md`.
- VS Code's markdown linter does not resolve root-relative links and will flag
  them as unresolved — this is a known VS Code limitation, not a broken link.
  AI agents, GitHub, and human readers all handle them correctly; accept the
  warning and use this format freely.
- Prefer explicit HTML anchors for stable deep-links when links must survive
  heading edits:

```html
<a id="api-errors"></a> ## API error handling
```

- GitHub auto-generates heading slugs (lowercasing, punctuation removal). When
  in doubt, add an explicit HTML anchor so the target id is renderer-independent.
- Fragment-only links within the same file (e.g., `[Section 6](#examples-templates)`)
  are fine as-is.

Sources: [WHATWG — fragment identifiers](https://html.spec.whatwg.org/multipage/browsing-the-web.html#fragment-identifiers), [GitHub — relative links in markup files](https://github.blog/news-insights/product-news/relative-links-in-markup-files/), [GitHub — linking to headings](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links), [Agent Skills — explicit anchors](https://agentskills.io/skill-creation/best-practices#:~:text=Prefer%20explicit%20HTML%20anchors)

<a id="examples-templates"></a>

### 6) Examples, templates & patterns

- Provide short concrete examples and I/O pairs to teach style (better than
  lengthy prose).
- Use template patterns for strict output requirements and flexible defaults
  when adaptation is allowed.
- Include a short `Gotchas` section for project-specific non-obvious rules.
- Use checklists for multi-step workflows (form filling, migrations), and a
  plan-validate-execute pattern for destructive operations.

Examples (short):

Explicit anchor + heading (example):

```html
<a id="api-errors"></a> ## API error handling
```

Template snippet:

```markdown
# [Analysis Title]

## Executive summary

[One-paragraph overview]
```

Checklist snippet:

```markdown
- [ ] Analyze form (`scripts/analyze_form.py`)
- [ ] Create mapping (`fields.json`)
- [ ] Validate (`scripts/validate_fields.py`)
```

Sources: [Agent Skills — examples, templates, gotchas](https://agentskills.io/skill-creation/best-practices#:~:text=Gotchas), [Claude — examples & templates](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Template%20pattern).

<a id="scripts-execution-runtime"></a>

### 7) Scripts, execution & runtime

- Bundle utility scripts for deterministic operations; prefer execution over
  asking the agent to generate code at runtime.
- Make execution intent explicit: say `Run scripts/analyze_form.py` vs `See
scripts/analyze_form.py for the algorithm` depending on whether to execute
  or reference the script.
- Include validators or preflight checks for scripts that modify shared state
  or are destructive (plan-validate-execute pattern).
- Avoid hardcoding time-sensitive values (API versions, dates, model names)
  directly in the skill body — move these to a changelog or historical notes
  section.

Sources: [Agent Skills — spending context & avoiding time-sensitive info](https://agentskills.io/skill-creation/best-practices#:~:text=Spending%20context%20wisely), [Claude — avoiding time-sensitive content](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Avoid%20time-sensitive%20information).

<a id="safety-idempotency-secrets"></a>

### 8) Safety, idempotency & secrets

- **Idempotency:** operations that modify files, databases, or shared state
  should be safe to re-run. Document any non-idempotent steps and require
  explicit confirmation before executing them.
- **Destructive operations:** always use a plan-validate-execute pattern. The
  agent should state what it will do, optionally run a dry-run or preflight
  check, then ask for confirmation before irreversible actions.
- **Secrets & credentials:** never embed API keys, tokens, passwords, or PII
  in a skill body, examples, or reference files — even as placeholders. Use
  environment variable names as stand-ins (e.g., `$API_KEY`) and document
  where the real value is stored.
- **Sensitive data in examples:** sanitize all example inputs and outputs;
  strip real usernames, emails, account IDs, or internal URLs before
  committing a skill.
- Treat skill files as public: assume they will be version-controlled, shared,
  and read by people outside your immediate team.

Sources: [OWASP Developer Guide](https://devguide.owasp.org/), [Claude — safety guidelines](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

<a id="tool-permission-declarations"></a>

### 9) Tool & permission declarations

- Declare which tools the skill requires (file read, terminal execution,
  browser, network, etc.) so consumers can verify their environment supports
  them before invoking the skill.
- Apply the principle of least privilege: request only the tools and
  permissions the skill genuinely needs. Do not grant broad filesystem or
  network access when a narrow operation suffices.
- Document tool dependencies explicitly near the top of the skill body:

    ```
    **Requires:** file-read, terminal (read-only). No network access needed.
    ```

- If a skill step requires elevated permissions (sudo, admin, write to shared
  infrastructure), isolate it, document why it is needed, and add a
  confirmation gate.
- When a tool is optional (e.g., browser preview), mark it as such and provide
  a fallback path for environments where it is unavailable.

Sources: [Agent Skills — tool declarations](https://agentskills.io/skill-creation/best-practices), [Claude — skill permissions](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

<a id="testing-evaluation"></a>

### 10) Testing, evaluation & iteration

- Build evaluations before finalizing the skill body ("eval-driven
  development"): define expected inputs/outputs first, then write the skill.
- Test on the target model(s); behavior may differ across model versions and
  provider configurations.
- Iterate from real execution: if the agent makes systematic errors, revise
  the relevant section rather than adding more prose elsewhere.
- Include short I/O examples that double as informal evals (input → expected
  output or action).

Sources: [Claude — evaluation-driven development](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Build%20evaluations%20first), [Agent Skills — refine with real execution](https://agentskills.io/skill-creation/best-practices#:~:text=Refine%20with%20real%20execution).

<a id="maintenance-change-control"></a>

### 11) Maintenance & change control

- Track breaking changes: when renaming headings or removing sections, preserve
  old anchors or update all inbound links to avoid silent broken links.
- Review skills periodically; prune outdated guidance that may mislead agents.
- When a skill is shared across multiple consumers (agents, workflows), test
  each consumer after updates.
- Prefer small, incremental updates over large rewrites — easier to review,
  revert, and attribute to a specific change.
- Move deprecated content to a `CHANGELOG.md` or `history/` folder rather
  than leaving stale text in `SKILL.md`.
- **Versioning:** bump a version marker (e.g., `version: 1.2` in frontmatter
  or a `## Changelog` section) whenever you make a breaking change. Communicate
  the change to consumers — link the PR or commit in the changelog.
- Prefer backwards compatibility: add new sections rather than removing old
  ones; use a `> **Moved:** see [section X](#anchor).` note when content
  relocates to avoid silent broken references.

Sources: [Agent Skills — maintenance & versioning](https://agentskills.io/skill-creation/best-practices#:~:text=maintenance), [Claude — avoiding time-sensitive content](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Avoid%20time-sensitive%20information).

<a id="skill-composition"></a>

### 12) Skill composition & dependencies

- Skills can reference companion skills by instructing the agent to load a
  specific `SKILL.md` file — but do this sparingly. Deep chains consume context
  and make debugging difficult.
- Avoid circular references: if skill A loads skill B, skill B must not load
  skill A. Document dependency direction clearly.
- Prefer one cohesive skill over a chain of micro-skills when the tasks always
  appear together. Split only when each part is genuinely reusable
  independently.
- Declare required companion skills near the top of the skill body:

    ```markdown
    **Depends on:** [`effect-schema/SKILL.md`](/skills/effect-schema/SKILL.md)
    — load it when the task requires defining or updating a schema.
    ```

- Test the _combined_ invocation when composing skills — the cumulative token
  cost of multiple loaded skills can exceed context limits.

Sources: [Agent Skills — skill composition](https://agentskills.io/skill-creation/best-practices), [Claude — tool use & chaining](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

<a id="output-format"></a>

### 13) Output format & response style

Agents default to whatever output format feels natural. Without explicit
instructions, output format is one of the most common sources of inconsistent
skill behavior. Be explicit.

- Specify the output format: prose, bulleted list, fenced code block, JSON,
  table, or a named template. If the skill has a strict output contract,
  provide a template (see [Section 6](#examples-templates)).
- Specify length expectations: "one paragraph", "≤10 bullet points", "full
  file contents". Omitting this often produces overly verbose output.
- Specify when to use code blocks vs. inline code vs. plain text.
- Instruct on headers: "use `##` headings for each section" or "no headers —
  flat prose only."
- If the skill produces multiple artifacts (e.g., a summary + a code file),
  specify order and how to delimit them.
- Specify tone/register when it matters: "terse and technical", "user-facing
  copy — no jargon", "commit-message style".

Example instruction block in a skill body:

```markdown
**Output format:** A single fenced TypeScript code block. No prose before or
after. No explanatory comments inside the block unless the logic is non-obvious.
```

<a id="error-handling"></a>

### 14) Error handling & fallback patterns

Without instructions the agent may silently produce wrong output, hallucinate
missing inputs, or stop with a cryptic message. Specify the failure contract
explicitly.

- **Precondition failures:** if a required file, env var, or tool is missing,
  instruct the agent to stop and report what is missing rather than guessing.
- **Partial failures:** for multi-step workflows, specify whether to abort on
  first error or continue and report all errors at the end.
- **Ambiguous input:** if the user's request is underspecified, instruct the
  agent to ask one focused clarifying question rather than proceeding with an
  assumption (see [Section 16](#clarifying-questions)).
- **Optional tool unavailable:** provide a fallback path or instruct the agent
  to inform the user and stop gracefully (see [Section 9](#tool-permission-declarations)).
- **Dry-run / preflight output:** for destructive or irreversible operations,
  instruct the agent to output a summary of what _would_ change before
  executing.

Example instruction:

```markdown
If `fields.json` does not exist, stop immediately and output:
"Error: fields.json not found. Run `scripts/analyze_form.py` first."
Do not attempt to generate the file.
```

<a id="preconditions"></a>

### 15) Precondition & context gathering

Agents don't automatically read necessary files or check environment state —
they act on what is in context. Explicitly instruct the agent to gather what
it needs before starting.

- List required reads at the top of the skill: "Before proceeding, read
  `src/schema.ts` and `src/api-types.ts`."
- Specify environment checks: "Verify `$DATABASE_URL` is set before running
  any migration script."
- Specify repo-state checks: "Check `git status` — warn if there are
  uncommitted changes before modifying files."
- For skills that depend on prior workflow steps, instruct the agent to
  verify that those steps completed (e.g., check for an output file or a
  specific git commit message pattern).
- Keep precondition checks early and fast-fail: a skill that reads ten files
  and then fails on a missing env var wastes context.

<a id="clarifying-questions"></a>

### 16) Clarifying questions & default assumptions

One of the most common failure modes is an agent that either asks too many
questions (interrupting flow) or silently assumes the wrong thing.

- Define a **default assumption policy**: list the assumptions the agent
  should make when information is absent, so it can proceed without asking.
- Define a **must-ask threshold**: list the inputs so consequential that the
  agent must ask rather than assume (e.g., target environment: staging vs.
  production).
- When the agent must ask, instruct it to ask **one focused question at a
  time**, not a multi-part survey.
- Instruct the agent to state its assumption when proceeding without asking:
  "Proceeding with X — let me know if you intended Y."
- Avoid open-ended asks ("What would you like me to do?"). The skill should
  narrow the question to a specific decision point.

Example policy block:

```markdown
**Defaults (proceed without asking):** TypeScript, ESM modules, no test file.
**Always ask:** target file path if not provided in the user message.
```

<a id="anti-patterns"></a>

### 17) Anti-patterns

Concrete examples of what to avoid.

**Over-broad description (over-triggers):**

```yaml
# Bad — fires on nearly any coding request
description: Help with TypeScript code.

# Good
description: >
  Generate Effect Schema validators from TypeScript types. Use when the user
  asks to add or update runtime validation for an existing type. Do NOT use
  for Supabase RLS policies or non-Effect-Schema validation.
```

**Vague output instructions (inconsistent results):**

```markdown
# Bad
Generate the migration file.

# Good
Generate the migration file as a single fenced SQL code block. Include a
rollback section after a `-- rollback` comment. No prose outside the block.
```

**Silent assumption on destructive action:**

```markdown
# Bad — agent deletes without confirming
Delete all `.tmp` files in the `dist/` directory.

# Good
List all `.tmp` files that would be deleted. Ask for confirmation before
removing any files.
```

**Eager reference loading (wastes context):**

```markdown
# Bad — always loads large reference
Read `references/all-api-endpoints.md` before starting.

# Good
If the task involves the payments API, read `references/payments-api.md`.
Otherwise proceed without loading reference files.
```

**Embedded secret placeholder:**

```yaml
# Bad — even fake values train bad habits
api_key: sk-proj-abc123...

# Good — use env var name only
api_key: $OPENAI_API_KEY  # set in .env or shell environment
```

<a id="debugging"></a>

### 18) Debugging a poorly-behaving skill

When a skill isn't working as expected, diagnose systematically rather than
adding more prose.

- **Not triggering:** test whether the description matches the user's actual
  phrasing. Try paraphrasing the request. Check for under-triggering (too
  narrow) vs. the wrong skill triggering (too broad a rival skill).
- **Triggering on wrong requests:** tighten the description with explicit
  `Do NOT use for…` exclusions. Test with prompts that should _not_ invoke
  the skill.
- **Agent skips steps:** steps may be buried in prose. Convert prose
  instructions to a numbered list or checklist — agents follow ordered lists
  more reliably.
- **Agent produces wrong output format:** add or tighten the output format
  block (see [Section 13](#output-format)). A missing format instruction is
  often the root cause.
- **Agent asks too many questions / too few:** revisit the clarifying-questions
  policy (see [Section 16](#clarifying-questions)). Spell out defaults
  explicitly.
- **Agent hallucinates missing files:** add explicit precondition checks
  (see [Section 15](#preconditions)) that fast-fail with a clear error message.
- **Behavior differs across model versions:** add a short I/O example that
  pins the expected behavior. If the regression is systematic, consider
  adding a model-specific note in the skill body.
- **Diagnosis rule:** if the same mistake recurs after one edit, the
  instruction is ambiguous — rewrite that section rather than appending a
  correction elsewhere.

<a id="quick-checklist"></a>

### 19) Quick checklist (pre-release)

- [ ] `name` and `description` clear and conform to rules; trigger language tested
- [ ] `user-invocable` set correctly for the intended invocation mode
- [ ] `SKILL.md` body size reasonable (<500 lines recommended); context budget considered
- [ ] One-level references; long refs have TOC
- [ ] Templates, examples, gotchas present where useful
- [ ] Output format explicitly specified
- [ ] Error handling and fallback behavior defined
- [ ] Preconditions listed; fast-fail instructions included
- [ ] Clarifying-question policy defined (defaults vs. must-ask)
- [ ] Scripts provided for deterministic work; validators included
- [ ] Destructive operations have confirmation gates; skill is idempotent where possible
- [ ] No secrets, credentials, or PII in skill body or examples
- [ ] Tool/permission requirements declared
- [ ] Skill dependencies documented; no circular references
- [ ] Tests/evaluations created and run on target models

---

<a id="sources"></a>

### 20) Sources

- [Agent Skills — Best practices](https://agentskills.io/skill-creation/best-practices)
    - [Progressive disclosure](https://agentskills.io/skill-creation/best-practices#:~:text=progressive%20disclosure)
    - [Start from real expertise](https://agentskills.io/skill-creation/best-practices#:~:text=Start%20from%20real%20expertise)
    - [Refine with real execution](https://agentskills.io/skill-creation/best-practices#:~:text=Refine%20with%20real%20execution)

- [Claude / Anthropic — Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
    - [Concise is key](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Concise%20is%20key)
    - [Skill structure (frontmatter rules)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Skill%20structure)
    - [Executable scripts & runtime notes](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Advanced%3A%20Skills%20with%20executable%20code)
    - [Evaluation-driven development](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#:~:text=Build%20evaluations%20first)

- [CommonMark spec](https://spec.commonmark.org/)
- [WHATWG HTML — fragment identifiers](https://html.spec.whatwg.org/multipage/browsing-the-web.html#fragment-identifiers)
- [RFC 3986 — URI/fragment syntax](https://datatracker.ietf.org/doc/html/rfc3986#section-3.5)
- [GitHub — linking to headings guidance](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links)

## Files

- This canonical guidance is saved at [/docs/skill-best-practices.md](/docs/skill-best-practices.md).
- Short guidance SKILL remains at [/skills/skill-best-practices/SKILL.md](/skills/skill-best-practices/SKILL.md).
