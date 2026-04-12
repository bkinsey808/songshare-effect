# API Area

This directory inherits the repo root [`/AGENTS.md`](/AGENTS.md). For work
under `api/`, load the smallest relevant set from:

- [`skills/hono-best-practices/SKILL.md`](/skills/hono-best-practices/SKILL.md)
- [`skills/effect-ts-patterns/SKILL.md`](/skills/effect-ts-patterns/SKILL.md)
- [`skills/authentication-system/SKILL.md`](/skills/authentication-system/SKILL.md)
- [`skills/supabase-client-patterns/SKILL.md`](/skills/supabase-client-patterns/SKILL.md)
- [`skills/realtime-rls-architecture/SKILL.md`](/skills/realtime-rls-architecture/SKILL.md)
- [`skills/realtime-rls-debugging/SKILL.md`](/skills/realtime-rls-debugging/SKILL.md)
- [`skills/typescript-best-practices/SKILL.md`](/skills/typescript-best-practices/SKILL.md)
- [`skills/file-organization/SKILL.md`](/skills/file-organization/SKILL.md)

Area-specific reminders:

- Prefer Effect and Hono patterns that match nearby code.
- Keep auth, RLS, and realtime changes aligned with the shared auth and
  database skills above.
- Use staging-first workflows for migrations and deployments; do not run
  production Supabase or deploy commands without explicit human confirmation.
