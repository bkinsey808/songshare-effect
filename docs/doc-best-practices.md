# Documentation Best Practices
 
This guide establishes documentation standards for this project, following industry best practices and adapting them to our workflow.
 
## Table of Contents
 
- [Quick Decision Trees](#quick-decision-trees)
    - [When to Create New Documentation](#when-to-create-new-documentation)
    - [What Type of Documentation to Create](#what-type-of-documentation-to-create)
    - [Where to Place Documentation](#where-to-place-documentation)
- [Document Structure](#document-structure)
    - [File Naming](#file-naming)
    - [Required Elements](#required-elements)
    - [Table of Contents](#table-of-contents)
    - [Anchor Links](#anchor-links)
- [Writing Style](#writing-style)
    - [Clarity and Conciseness](#clarity-and-conciseness)
    - [Audience and Tone](#audience-and-tone)
    - [Active vs Passive Voice](#active-vs-passive-voice)
    - [Avoid Jargon Unless Necessary](#avoid-jargon-unless-necessary)
- [Formatting Standards](#formatting-standards)
    - [Headers](#headers)
    - [Lists](#lists)
    - [Code Blocks](#code-blocks)
    - [Emphasis](#emphasis)
    - [Tables](#tables)
    - [Section Separators](#section-separators)
    - [Line Length](#line-length)
- [Content Organization](#content-organization)
    - [Cross-Reference Pattern](#cross-reference-pattern)
    - [Skill and Doc Pairing](#skill-and-doc-pairing)
    - [Minimum Viable Documentation](#minimum-viable-documentation)
    - [Document Layout Pattern](#document-layout-pattern)
    - [Progressive Disclosure](#progressive-disclosure)
    - [Decision Trees for Guidance](#decision-trees-for-guidance)
- [Links and References](#links-and-references)
    - [Internal Links](#internal-links)
    - [External Links](#external-links)
    - [File References](#file-references)
    - [When to Use Relative vs Absolute Paths](#when-to-use-relative-vs-absolute-paths)
- [Maintenance](#maintenance)
    - [Keeping Documentation Current](#keeping-documentation-current)
    - [Deprecating Outdated Content](#deprecating-outdated-content)
    - [Review Cycles](#review-cycles)
- [Accessibility](#accessibility)
    - [Alt Text for Images](#alt-text-for-images)
    - [Descriptive Link Text](#descriptive-link-text)
    - [Screen Reader Considerations](#screen-reader-considerations)
 
---
 
<a id="quick-decision-trees"></a>
 
## Quick Decision Trees
 
<a id="when-to-create-new-documentation"></a>
 
### When to Create New Documentation
 
```
Does this concept require more than 3 paragraphs of explanation?
├─ No → Add to existing doc or inline code comments
└─ Yes → Is it a standalone topic?
    ├─ No → Expand existing doc with new section
    └─ Yes → Create new doc
```
 
<a id="what-type-of-documentation-to-create"></a>
 
### What Type of Documentation to Create
 
```
What am I documenting?
├─ Coding patterns/standards → Create in /docs/ as *-best-practices.md
├─ Project setup/tooling → Update README.md or create /docs/setup-*.md
├─ Architecture/design decisions → Create /docs/architecture-*.md
├─ API/component behavior → Add JSDoc/TSDoc comments inline + /docs/ reference if complex
├─ Testing patterns → Create /docs/*-test-best-practices.md
└─ Troubleshooting → Create /docs/troubleshooting-*.md or add to existing
```
 
<a id="where-to-place-documentation"></a>
 
### Where to Place Documentation
 
```
Where should this documentation live?
├─ General project info (setup, contributing) → Root-level README.md
├─ Coding standards & patterns → /docs/*-best-practices.md
├─ Feature/component deep dive → /docs/[feature-name].md
├─ Code-level implementation details → Inline JSDoc/TSDoc comments
└─ Skill definitions for AI agents → /.github/skills/[name]/SKILL.md
```
 
---
 
<a id="document-structure"></a>
 
## Document Structure
 
<a id="file-naming"></a>
 
### File Naming
 
Use lowercase with hyphens:
 
**✅ Good:**
 
```
doc-best-practices.md
unit-test-best-practices.md
playwright-best-practices.md
```
 
**❌ Bad:**
 
```
Doc_Best_Practices.md
UnitTestBestPractices.md
playwright.best.practices.md
```
 
**Rationale:** Hyphens are the most common URL separator, and Markdown files are often served as web content (e.g., GitHub). Lowercase avoids case-sensitivity issues across operating systems.
 
<a id="required-elements"></a>
 
### Required Elements
 
Every documentation file should include:
 
1. **Title (H1)** — One per document, at the top
2. **Brief introduction** — 1-3 sentences explaining purpose and scope
3. **Table of Contents** — For docs longer than ~150 lines or with 3+ sections
4. **Body content** — Organized with H2/H3 headers
5. **Optional "See also" section** — Links to related docs (at bottom)
 
<a id="table-of-contents"></a>
 
### Table of Contents
 
Place the ToC immediately after the introduction:
 
```markdown
# Document Title
 
Brief introduction explaining what this document covers.
 
## Table of Contents
 
- [Section One](#section-one)
    - [Subsection A](#subsection-a)
    - [Subsection B](#subsection-b)
- [Section Two](#section-two)
 
<a id="section-one"></a>
 
## Section One
 
Content...
```
 
**Note:** The `<a id="...">` tag goes **before** the heading it anchors, not after.
 
**Rationale:** Readers who use screen readers or keyboard navigation encounter the ToC in logical document order, making navigation easier.
 
<a id="anchor-links"></a>
 
### Anchor Links
 
Use explicit `<a id="...">` tags for all headings that appear in the Table of Contents.
 
**Format:**
 
- Convert heading text to lowercase
- Replace spaces with hyphens
- Remove punctuation (except hyphens)
- Strip leading numbers if auto-generated
 
**Example:**
 
```markdown
## Table of Contents
 
- [Component Props](#component-props)
- [Naming Conventions](#naming-conventions)
 
<a id="component-props"></a>
 
## Component Props
 
<a id="naming-conventions"></a>
 
## Naming Conventions
```
 
**Rationale:** Explicit anchors ensure consistency across Markdown renderers. GitHub auto-generates anchors, but they can change if heading text is modified. Explicit anchors are stable and renderer-agnostic.
 
---
 
<a id="writing-style"></a>
 
## Writing Style
 
<a id="clarity-and-conciseness"></a>
 
### Clarity and Conciseness
 
Write for comprehension, not word count.
 
**✅ Good:**
 
```markdown
Use `ReactNode` for props that accept any renderable content.
```
 
**❌ Verbose:**
 
```markdown
When you are defining props for a component and you need to accept
any kind of renderable content, you should use the `ReactNode` type.
```
 
**Guidelines:**
 
- Prefer active voice
- Use short sentences (aim for <25 words)
- Break complex ideas into bulleted lists
- Define acronyms on first use: `"GUI (Graphical User Interface)"`
 
<a id="audience-and-tone"></a>
 
### Audience and Tone
 
Assume the reader is a competent developer but may be new to this project.
 
**✅ Good tone:**
 
```markdown
Use `vi.mocked()` to cast mocked functions with proper types.
```
 
**❌ Condescending:**
 
```markdown
Obviously, you should use `vi.mocked()` because that's the only sensible way.
```
 
**❌ Over-explaining basics:**
 
```markdown
TypeScript is a typed superset of JavaScript. Functions in TypeScript
can have return types. To specify a return type, use a colon...
```
 
<a id="active-vs-passive-voice"></a>
 
### Active vs Passive Voice
 
Prefer active voice for clarity and directness.
 
**✅ Active (preferred):**
 
```markdown
The test fails when the mock returns `undefined`.
```
 
**❌ Passive (avoid):**
 
```markdown
The test is failed when `undefined` is returned by the mock.
```
 
**When passive is acceptable:**
 
- Emphasizing the action over the actor: "The file is generated from the schema."
- The actor is unknown or irrelevant: "The issue was reported last week."
 
<a id="avoid-jargon-unless-necessary"></a>
 
### Avoid Jargon Unless Necessary
 
Define technical terms when first introduced, especially project-specific patterns.
 
**✅ Good:**
 
```markdown
Use the non-factory `vi.mock()` pattern (calling `vi.mock()` without
a factory function) for most cases.
```
 
**❌ Assumes too much:**
 
```markdown
Use non-factory mocking.
```
 
---
 
<a id="formatting-standards"></a>
 
## Formatting Standards
 
<a id="headers"></a>
 
### Headers
 
**Use ATX-style headers (`#`)** — not Setext-style (`===` or `---`):
 
**✅ Good:**
 
```markdown
# Header 1
 
## Header 2
 
### Header 3
```
 
**❌ Avoid:**
 
```markdown
# Header 1
 
## Header 2
```
 
**Header spacing:**
 
- One space after the `#` character(s)
- One blank line before and after headers (except at file start)
- No closing `#` characters
 
**Header hierarchy:**
 
- One H1 per document (title)
- Don't skip levels (no H1 → H3)
- Limit nesting to H3 or H4 for readability
 
**Header capitalization:**
 
- Use Title Case for all headings (H1 through H4)
- Capitalize major words; lowercase articles, prepositions, and conjunctions (a, an, the, and, but, or, in, on, for, to, with) unless they are the first word
 
**✅ Good:**
 
```markdown
# React Best Practices
 
## Component Props
 
### Common Prop Types
```
 
**❌ Avoid:**
 
```markdown
## component props
 
## component-props
```
 
**Rationale:** Title Case is the established convention in this project. All existing docs (`react-best-practices.md`, `typescript-best-practices.md`, `unit-test-best-practices.md`) use Title Case headings.
 
**Unique heading names:**
 
- Use unique, descriptive names for each heading — even for subsections
- Avoid generic names like "Summary" or "Example" repeated under different parents
- Since anchor links are generated from heading text, unique names ensure stable, intuitive anchors
 
**✅ Good:**
 
```markdown
## Foo
 
### Foo Summary
 
### Foo Example
 
## Bar
 
### Bar Summary
 
### Bar Example
```
 
**❌ Avoid:**
 
```markdown
## Foo
 
### Summary
 
### Example
 
## Bar
 
### Summary
 
### Example
```
 
<a id="lists"></a>
 
### Lists
 
**Unordered lists:**
 
- Use hyphens (`-`), not asterisks (`*`) or plus signs (`+`)
- One space after the marker
- 4-space indent for nested items
 
**✅ Good:**
 
```markdown
- Item one
- Item two
    - Nested item
    - Another nested item
- Item three
```
 
**❌ Avoid:**
 
```markdown
- Item one
 
* Item two
```
 
**Ordered lists:**
 
- Use `1.` for all items (unless referencing by number externally)
- One space after the marker
 
**✅ Preferred (most cases):**
 
```markdown
1. First step
1. Second step
1. Third step
```
 
**Acceptable (when items are referenced by number):**
 
```markdown
1. First requirement
2. Second requirement
3. Third requirement
```
 
**Rationale:** Using `1.` for all items makes reordering easier and produces cleaner diffs.
 
**Punctuation in list items:**
 
- Omit periods for single-line items that are sentence fragments
- Include periods for complete sentences or multi-line items
- Be consistent within each list
 
**✅ Good:**
 
```markdown
- apple
- banana
- orange
```
 
**✅ Also good:**
 
```markdown
- Go to the store.
- Buy some fruit. Look for fresh produce.
- Return home.
```
 
<a id="code-blocks"></a>
 
### Code Blocks
 
Always use fenced code blocks with language specifiers:
 
**✅ Good:**
 
````markdown
```typescript
const value: string = 'example';
```
````
 
**❌ Avoid:**
 
````markdown
```
const value: string = "example";
```
````
 
**❌ Avoid (indented code blocks):**
 
```markdown
    const value: string = "example";
```
 
**Rationale:** Fenced blocks with language specifiers enable syntax highlighting and are easier to edit.
 
**Inline code:**
Use backticks for:
 
- Function/variable names: `` `useState` ``
- File paths: `` `src/App.tsx` ``
- Command-line tools: `` `npm` ``
- Short code snippets: `` `const x = 1` ``
 
**Don't use inline code for:**
 
- Project names: React (not `` `React` ``)
- Emphasis (use **bold** or _italic_)
 
<a id="emphasis"></a>
 
### Emphasis
 
**Bold (`**text**`):**
 
- Key terms on first introduction
- Important warnings or notes
- Headers within lists (when not using actual headers)
 
**Italic (`*text*`):**
 
- Rare; prefer bold or restructure
- Can be used for subtle emphasis or terminology
 
**❌ Avoid:**
 
- UPPERCASE FOR EMPHASIS (use bold instead)
- Underscores for emphasis (use asterisks for consistency)
 
<a id="tables"></a>
 
### Tables
 
Use tables when presenting tabular data that benefits from scanning across two dimensions.
 
**When to use tables:**
 
- Comparing options with shared attributes (decision guides, feature matrices)
- Small, uniform data sets with parallel structure
- Quick-reference lookups
 
**When NOT to use tables:**
 
- Data that is mostly prose (use lists or subsections instead)
- Many empty cells or unbalanced columns
- Only 1-2 columns (a list is simpler)
 
**Formatting rules:**
 
- Surround tables with blank lines
- Use header separators (`|---|`)
- Keep cells concise — use reference-style links for long URLs
- Align pipes for readability (editor plugins help)
 
**✅ Good (compact, scannable):**
 
```markdown
| Matcher         | Use When                       |
| --------------- | ------------------------------ |
| `toStrictEqual` | Full object equality (default) |
| `toMatchObject` | Partial match                  |
| `toEqual`       | Intentionally loose comparison |
```
 
**❌ Avoid (data better as a list):**
 
```markdown
| Fruit  | Description                                             |
| ------ | ------------------------------------------------------- |
| Apple  | A red fruit that is juicy and firm and very popular...  |
| Banana | A yellow fruit that is convenient and soft and sweet... |
```
 
<a id="section-separators"></a>
 
### Section Separators
 
Use horizontal rules (`---`) to visually separate major top-level sections:
 
```markdown
## Section One
 
Content...
 
---
 
## Section Two
 
Content...
```
 
**When to use `---`:**
 
- Between major H2 sections in long documents
- After the ToC, before the first content section
 
**When NOT to use:**
 
- Between every subsection (overuse reduces visual impact)
- As a substitute for proper heading hierarchy
 
<a id="line-length"></a>
 
### Line Length
 
**Target:** 80-100 characters per line for prose.
 
**Exceptions:**
 
- Long URLs (don't break)
- Tables
- Code blocks
- Headings
 
**Rationale:** Shorter lines improve readability in side-by-side diffs, code reviews, and text editors without word wrap.
 
**When to wrap:**
 
- After sentences (period, question mark, exclamation)
- After clauses (commas, conjunctions)
- At logical phrase boundaries
 
**✅ Good:**
 
```markdown
This is a long sentence that wraps at a logical point, such as after
a comma or at the end of a complete clause.
```
 
**Note:** This project does not enforce strict line length for Markdown, but aim for readability.
 
---
 
<a id="content-organization"></a>
 
## Content Organization
 
<a id="cross-reference-pattern"></a>
 
### Cross-Reference Pattern
 
When a document has a closely related companion doc, add a cross-reference callout at the top (immediately after the H1 title, before the ToC):
 
**✅ Good:**
 
```markdown
# React Best Practices
 
> **Note:** For TypeScript-specific best practices (type definitions, return types,
> type safety), see [TypeScript Best Practices](typescript-best-practices.md).
 
## Table of Contents
```
 
**When to use:**
 
- Two docs cover overlapping or adjacent domains (React ↔ TypeScript, unit tests ↔ hook tests)
- Readers are likely to land on the wrong doc and need redirection
- The relationship is not obvious from the titles alone
 
**Format:** Use a blockquote with bold "Note:" prefix and a descriptive link.
 
<a id="skill-and-doc-pairing"></a>
 
### Skill and Doc Pairing
 
When a topic area has enough depth to warrant best-practices documentation, pair it with an AI agent skill. This is an established pattern in the project:
 
| Skill (`.github/skills/`)       | Comprehensive Doc (`/docs/`)             |
| ------------------------------- | ---------------------------------------- |
| `unit-test-best-practices`      | `unit-test-best-practices.md`            |
| `unit-test-hook-best-practices` | `unit-test-hook-best-practices.md`       |
| `react-best-practices`          | `react-best-practices.md`                |
| `typescript-best-practices`     | `typescript-best-practices.md`           |
| `zustand-best-practices`        | `zustand-best-practices.md`              |
| `code-comment-best-practices`   | `code-comment-best-practices.md`         |
| `lint-first-authoring`          | `lint-best-practices.md`                 |
| `playwright-testing`            | `playwright-best-practices.md`           |
| `authentication-system`         | `authentication-system.md`               |
| `effect-ts-patterns`            | `effect-ts-best-practices.md`            |
| `deployment-strategies`         | `devops/deploy.md`                       |
| `internationalization`          | `internationalization-system.md`         |
| `skill-best-practices`          | `skill-best-practices.md`                |
| `doc-best-practices`            | `doc-best-practices.md`                  |
 
**How the pair works:**
 
- **Skill** — Concise (<300 lines). Contains essential patterns, decision trees, and `**Details:**` deep links to the doc. Consumed by AI agents as context.
- **Doc** — Comprehensive. Contains full examples, rationale, edge cases, and ✅/❌ patterns. The authoritative reference for humans and agents alike.
 
**When to create a skill+doc pair:**
 
```
Is this a recurring task with clear patterns?
├─ No → Doc only is fine
└─ Yes → Will AI agents perform this task?
    ├─ No → Doc only
    └─ Yes → Create both
        ├─ Write the doc first (comprehensive reference)
        └─ Then write the skill (concise, with deep links to the doc)
```
 
**Key principles:**
 
- Write the doc first — the skill references it, not the other way around
- Skills should not duplicate doc content; use deep links instead (`**Details:** [Section](/docs/file.md#anchor)`)
- Keep skills focused on agent behavior: preconditions, output format, error handling, decision routing
- See [skill-best-practices](/docs/skill-best-practices.md) for skill authoring guidance
 
<a id="minimum-viable-documentation"></a>
 
### Minimum Viable Documentation
 
**Better is better than best.**
 
A small set of accurate, up-to-date docs beats sprawling, outdated documentation.
 
**Principles:**
 
- Delete obsolete content aggressively
- Keep docs focused on essentials
- Iterate quickly; don't aim for perfection on the first pass
- Reviewers: prefer suggesting improvements over blocking merge
 
**Identify what you need:**
 
- API docs
- Setup/getting started
- Core patterns and best practices
- Troubleshooting/FAQ
 
**What to omit:**
 
- Implementation details that belong in code comments
- Overly detailed explanations of third-party libraries (link instead)
- Speculative future features
 
<a id="document-layout-pattern"></a>
 
### Document Layout Pattern
 
Follow this structure for most documentation:
 
```markdown
# Document Title
 
1-3 sentence introduction: what is this document about, and who should read it?
 
## Table of Contents
 
- [Section One](#section-one)
- [Section Two](#section-two)
 
<a id="section-one"></a>
 
## Section One
 
Content...
 
<a id="section-two"></a>
 
## Section Two
 
Content...
 
## See Also
 
- [Related Doc](related-doc.md)
- [External Resource](https://example.com)
```
 
<a id="progressive-disclosure"></a>
 
### Progressive Disclosure
 
Start with the most common use case, then cover edge cases and advanced topics.
 
**✅ Good structure:**
 
```markdown
## Using Feature X
 
Basic usage for 80% of cases.
 
### Advanced: Handling Edge Case Y
 
Details for unusual scenarios.
```
 
**❌ Avoid:**
 
```markdown
## Using Feature X
 
Feature X was created in 2024 to solve problem Z. It uses algorithm A
and has 17 configuration options...
 
### Basic Usage
 
Import the module...
```
 
**Rationale:** Most readers want the "how" before the "why" or deep background.
 
<a id="decision-trees-for-guidance"></a>
 
### Decision Trees for Guidance
 
Use ASCII decision trees to help readers (and AI) navigate choices quickly.
 
**Format:**
 
```
Question?
├─ Condition A → Action A
└─ Condition B → Is there a sub-condition?
    ├─ Yes → Sub-action 1
    └─ No → Sub-action 2
```
 
**Example:**
 
```
Should I use `toEqual` or `toStrictEqual`?
├─ Full object equality → Use `toStrictEqual` (default)
├─ Partial object match → Use `toMatchObject`
└─ Intentionally loose comparison → Use `toEqual` (document why)
```
 
**When to use decision trees:**
 
- Multiple valid approaches with clear selection criteria
- Common "which tool/pattern should I use?" questions
- Helping AI agents zero in on the right pattern faster
 
**Placement:**
 
- At the start of a document (section: "Quick Decision Trees")
- Inline before complex sections
- In dedicated troubleshooting/FAQ sections
 
---
 
<a id="links-and-references"></a>
 
## Links and References
 
<a id="internal-links"></a>
 
### Internal Links
 
Use relative paths for links within the repository:
 
**✅ Good:**
 
```markdown
See [React Best Practices](react-best-practices.md) for details.
```
 
**❌ Avoid:**
 
```markdown
See [React Best Practices](https://github.com/org/repo/blob/main/docs/react-best-practices.md).
```
 
**Linking to sections:**
 
```markdown
See [Component Props](react-best-practices.md#component-props).
```
 
**Within the same document:**
 
```markdown
See [Code Blocks](#code-blocks) above.
```
 
<a id="external-links"></a>
 
### External Links
 
Use descriptive link text, not "here" or "click here":
 
**✅ Good:**
 
```markdown
See the [CommonMark specification](https://commonmark.org/) for details.
```
 
**❌ Avoid:**
 
```markdown
For details, click [here](https://commonmark.org/).
```
 
**When to use reference-style links:**
 
- Long URLs that disrupt readability
- Same URL referenced multiple times
- Tables (keeps cell content clean)
 
**Example:**
 
```markdown
See the [style guide][google-style] and [CommonMark spec][commonmark].
 
[google-style]: https://google.github.io/styleguide/docguide/style.html
[commonmark]: https://commonmark.org/
```
 
<a id="file-references"></a>
 
### File References
 
When mentioning files:
 
- Use inline code for file names: `` `README.md` ``
- Don't use backticks when linking: `[README.md](README.md)` (not `` `[README.md](README.md)` ``)
 
**Example:**
 
```markdown
Update the `package.json` file. See [package.json](../package.json) for the schema.
```
 
<a id="when-to-use-relative-vs-absolute-paths"></a>
 
### When to Use Relative vs Absolute Paths
 
```
What am I linking to?
├─ Same directory → Relative: [file.md](file.md)
├─ Different directory in same repo → Relative: [file.md](../other/file.md)
├─ External web resource → Absolute: https://example.com
└─ Could move independently → Absolute repo URL (rare)
```
 
**Rationale:** Relative links work offline, in forks, and across branches. Absolute URLs are only needed for external resources.
 
---
 
<a id="maintenance"></a>
 
## Maintenance
 
<a id="keeping-documentation-current"></a>
 
### Keeping Documentation Current
 
**Documentation is part of the Definition of Done.**
 
When making code changes:
 
1. Update inline code comments (JSDoc/TSDoc)
2. Update relevant `/docs/` files
3. Update `README.md` if setup/usage changes
4. Mark outdated docs for review or deletion
 
**Version-specific docs:**
 
- Avoid documenting version-specific behavior unless critical
- If needed, include version info: "As of v2.0, the API uses..."
 
<a id="deprecating-outdated-content"></a>
 
### Deprecating Outdated Content
 
When functionality changes:
 
**Option 1: Update in place**
 
```markdown
## Using Feature X
 
~~Previously, Feature X required manual setup.~~ As of v3.0, Feature X
is auto-configured.
```
 
**Option 2: Remove entirely**
 
- Better for clean history
- Old versions remain in git history
 
**Option 3: Add deprecation notice**
 
```markdown
> **Deprecated:** This approach is no longer recommended. See [New Approach](new-approach.md).
```
 
<a id="review-cycles"></a>
 
### Review Cycles
 
**When to review documentation:**
 
- With every major release
- When user feedback indicates confusion
- Quarterly (for core docs like README, contribution guides)
 
**Review checklist:**
 
- Are links still valid?
- Is code syntax up-to-date?
- Are examples tested and working?
- Is the doc still relevant?
 
---
 
<a id="accessibility"></a>
 
## Accessibility
 
<a id="alt-text-for-images"></a>
 
### Alt Text for Images
 
Always provide alt text:
 
```markdown
![Diagram showing the component lifecycle](./images/lifecycle.png)
```
 
**Guidelines:**
 
- Describe the content/purpose, not just "image" or "diagram"
- For decorative images, use empty alt text: `![](decorative.png)`
- For complex diagrams, consider a detailed caption or linked description
 
<a id="descriptive-link-text"></a>
 
### Descriptive Link Text
 
Avoid "click here" or bare URLs as link text.
 
**✅ Good:**
 
```markdown
See the [accessibility guidelines](https://www.w3.org/WAI/) for more information.
```
 
**❌ Avoid:**
 
```markdown
Click [here](https://www.w3.org/WAI/) for more information.
See https://www.w3.org/WAI/ for more information.
```
 
**Rationale:** Screen readers often navigate by links. Descriptive link text provides context without surrounding prose.
 
<a id="screen-reader-considerations"></a>
 
### Screen Reader Considerations
 
**Table of Contents placement:**
 
- Place ToC after introduction, before main content
- Screen readers encounter it in logical order
 
**Heading hierarchy:**
 
- Don't skip levels (H1 → H3)
- Use semantic headers, not bold text for emphasis
 
**Lists:**
 
- Use actual Markdown lists (`-` or `1.`), not manual formatting
 
**✅ Good:**
 
```markdown
- Item one
- Item two
```
 
**❌ Avoid:**
 
```markdown
• Item one
• Item two
```
 
**Rationale:** Screen readers announce semantic list structures, improving navigation.
 
---
 
## See Also
 
- [Google Markdown Style Guide](https://google.github.io/styleguide/docguide/style.html)
- [Ciro Santilli's Markdown Style Guide](https://cirosantilli.com/markdown-style-guide/)
- [CommonMark Specification](https://commonmark.org/)
- [React Best Practices](react-best-practices.md) — Example of this guide in practice
- [Unit Test Best Practices](unit-test-best-practices.md) — Another example with decision trees
- [Skill Best Practices](skill-best-practices.md) — Guide for authoring SKILL.md files
- [Lint Best Practices](lint-best-practices.md) — Lint rules, formatter config, and common fix patterns
 
