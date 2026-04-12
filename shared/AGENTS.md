# Shared Area

This directory inherits the repo root [`/AGENTS.md`](/AGENTS.md). For work
under `shared/`, load the smallest relevant set from:

- [`skills/typescript-best-practices/SKILL.md`](/skills/typescript-best-practices/SKILL.md)
- [`skills/file-organization/SKILL.md`](/skills/file-organization/SKILL.md)
- [`skills/source-refactoring/SKILL.md`](/skills/source-refactoring/SKILL.md)
- [`skills/effect-ts-patterns/SKILL.md`](/skills/effect-ts-patterns/SKILL.md)
- [`skills/supabase-client-patterns/SKILL.md`](/skills/supabase-client-patterns/SKILL.md)

Area-specific reminders:

- Keep shared modules framework-agnostic unless the directory already establishes
  a stronger pattern.
- Favor stable types and schemas because this directory is consumed by both the
  frontend and API.
- Treat generated files carefully and avoid incidental churn.
