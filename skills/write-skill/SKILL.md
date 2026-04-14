---
name: write-skill
description: How to write, update, or split skill files in this repo. Use when creating a new SKILL.md, updating an existing one, or deciding whether to put content in a skill vs. docs/.
---

**Requires:** file-read. No terminal or network access needed.

# Write Skill

## Use When

- Creating a new `SKILL.md` under `skills/`.
- Updating an existing skill after learning new patterns.
- Deciding whether something belongs in a skill, a doc, or a workflow.

---

## Core Rules

1. **Skills must be ≤ 300 lines.** The CI check (`npm run check:skill-line-count`) enforces this. If you're over, move detail to `docs/` and deep-link.
2. **Skills are pointers, not encyclopedias.** A skill tells an agent _what to do_ and _where to look_. Full examples, reference tables, and historical context belong in `docs/`.
3. **Docs are the source of truth.** Skills defer to `docs/` via deep links. Update the doc when you learn something new; then update the skill to point at it.

---

## Structure

Every skill needs these sections in order:

```
---
name: <kebab-case-name>
description: <one sentence — what this covers and when to use it>
---

# <Title>

## Use When
<bullet list of trigger conditions>

---

## Execution Workflow (if the skill covers a multi-step task)
<numbered steps>

---

## Key Patterns
<only the most essential facts — defer detail to docs>

---

## References
<links to docs/, workflows, and related skills>

## Do Not
<short list of common mistakes to avoid>
```

---

## What Goes Where

| Content type                              | Where it lives                            |
| ----------------------------------------- | ----------------------------------------- |
| Step-by-step task workflow                | `.agent/workflows/<name>.md`              |
| Full pattern reference with many examples | `docs/<topic>.md`                         |
| Quick lookup table / rule summary         | `docs/lint-best-practices.md` or similar  |
| "Use this when X, do Y, see Z"            | `SKILL.md`                                |
| Project background / motivation           | `docs/`                                   |

---

## Deep Links

Skills should link into `docs/` at the heading level using GitHub-flavored Markdown anchors. Heading `## Foo Bar` becomes `#foo-bar`. Special chars are stripped; spaces become `-`:

```markdown
<!-- From a skill, linking into a doc section -->

See [→ Foo Bar pattern](../../../docs/my-doc.md#foo-bar)
```

IDE markdown linters may warn that fragment links can't be resolved — **ignore these warnings**. The links work on GitHub and in agent context.

---

## When to Split a Skill

Split when the skill covers two clearly distinct audiences or task types. Example: `unit-testing` and `unit-testing-hooks` are separate because hooks tests need a different setup. Don't split just to stay under 300 lines — trim first; split only when topic focus genuinely differs.

---

## Updating an Existing Skill

1. Read the current skill and the doc it points to.
2. Add new patterns to the **doc** first.
3. Add or update the deep link in the skill.
4. Bump `version` in frontmatter.
5. Run `npm run check:skill-line-count` to verify ≤ 300 lines.

---

## References

- Skill line-count check: `scripts/check-skill-line-count/`
- Workflows: [`.agent/workflows/`](/.agent/workflows/)
- Docs directory: `docs/`

## Do Not

- Do not put long code examples directly in a skill — put them in `docs/` and link.
- Do not exceed 300 lines — the CI check will fail.
- Do not duplicate content between a skill and a doc — the doc is canonical.
- Do not create a skill without a `description` frontmatter field — agents use it for relevance matching.
 - Never ask the user whether to commit code changes or open a pull request. Do not prompt with messages like "Would you like me to commit these tests and open a PR?" or any variant. Only mention commits or PRs when the user explicitly requests creation or review of a PR; otherwise omit commit/PR prompts entirely.
