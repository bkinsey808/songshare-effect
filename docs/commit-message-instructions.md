# 📣 Commit Message Instructions — Friendly Guide with Emojis 🎉

This document explains how to write clear, consistent commit messages for this repo. Good commit messages make code review faster, history easier to navigate, and releases more reliable. Use these guidelines whenever you create commits. ✅

---

## ✨ Why this matters

- **Discoverability**: Clean messages help teammates (and future you) find changes quickly. 🔍
- **Automation**: Consistent prefixes and structure enable release automation and changelog generation. 🤖
- **Context**: A short summary + a clear body provides context for later debugging. 🧭

---

## 🧭 Format (recommended)

Use this template for each commit:

```
<type>(<scope>): <short summary>

<body — more detailed explanation, wrapped at ~72 chars>

<footer — related issues, breaking changes, co-authors>
```

- `type`: one of the keywords in the emoji legend below (lowercase). Example: `feat`, `fix`, `docs`, `chore`. 🔤
- `scope`: optional; short area of the codebase (e.g., `api`, `react`, `scripts`). 🧩
- `short summary`: concise (preferably <= 50 chars) — imperative mood (e.g., "Add", "Fix"). 🗣️
- `body`: explain _what_ and _why_ (not _how_) when needed. Use multiple paragraphs if helpful. 📝
- `footer`: link issues with `#123`, note `BREAKING CHANGE:` if applicable, or add `Co-authored-by:` lines. 🔗

---

## 🧾 Emoji Legend (use the `type` keyword — emojis are optional in the message itself)

- feat: ✨ (New feature)
- fix: 🐛 (Bug fix)
- docs: 📝 (Documentation)
- style: 🎨 (Formatting, no code change)
- refactor: ♻️ (Code change that neither fixes a bug nor adds a feature)
- perf: ⚡ (Performance improvements)
- test: ✅ (Add or update tests)
- build: 🏗️ (Build system / CI changes)
- ci: 🔁 (CI config and scripts)
- chore: 🧹 (Maintenance tasks)
- revert: ⏪ (Revert to a previous commit)

Tip: You can prepend the emoji in the subject for readability, e.g. `feat: ✨ add search to songs` — but prefer the plain keyword first for tooling compatibility. 🛠️

---

## ✅ Examples

- Simple feature:

```
feat(supabase): add anonymous visitor token exchange
```

- Bug fix with body:

```
fix(api/session): prevent null pointer when no cookies present

The session middleware incorrectly assumed a cookie existed, causing
server-side errors when requests came from static assets. This adds a
null-check and an early return to avoid throwing.

Fixes: #812
```

- Docs update:

```
docs: ✨ update README with local dev steps
```

- Breaking change with footer:

```
refactor(auth): drop legacy visitor token format

This changes the token shape for visitor tokens. Servers that depend
on the old token format must migrate.

BREAKING CHANGE: visitor token v1 removed, replace with v2
```

---

## 🧰 Commit message tips & best practices

- Use the imperative mood: "Add", "Fix", "Remove" (not "Added", "Fixes"). 🗣️
- Keep subjects short and focused; move details to the body. ✂️
- Group related changes into a single commit where possible. 🧩
- Don’t include large formatting-only changes with functional changes. Separate them. 🎨 ➡️ 🛠️
- When a commit closes an issue, mention `Closes #<issue>` in the footer. 🔒

---

## 🧷 Templates you can copy

- Feature

```
feat(<scope>): <short summary>

<longer description / motivation / implementation notes>

Closes: #<issue>
```

- Bug fix

```
fix(<scope>): <short summary>

<longer description, root cause, and side-effects>

Fixes: #<issue>
```

- Chore

```
chore: <short summary>

<why this housekeeping change exists>
```

---

## 💡 Small checklist before committing

- [ ] Subject is short and imperative
- [ ] Body explains _why_ if not obvious
- [ ] Relevant issues noted in footer
- [ ] No unrelated files bundled into the same commit

---

## 🎯 Final notes

Keep messages clear and consistent — it pays off in reduced friction for reviews and better release notes. If you'd like, we can add a `git commit` hook to validate messages automatically (I can scaffold that if you want). 🚀

Happy committing! ✨🧑‍💻🎉
