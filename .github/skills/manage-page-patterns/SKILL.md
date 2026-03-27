---
name: manage-page-patterns
description: Patterns for admin/manage pages (community manage, event manage) — local actionState, runCommunityAction/runAction helpers, realtime as primary update path. Use when building manage pages with mutations like invite, kick, add, or remove.
---

**Requires:** file-read. No terminal or network access needed.

# Manage-Page Patterns Skill

## Use When

Use this skill when:

- Building or editing admin/manage page mutations and feedback flows.
- Working on realtime-backed updates for community/event management views.

Execution workflow:

1. Use local `actionState` mutation patterns; avoid store-level page-blanking loading flags.
2. Keep realtime subscriptions as the primary update path with silent refresh fallback.
3. Reuse shared action helpers (`runCommunityAction`/`runAction`) for mutation lifecycle.
4. Validate mutation UX and error states with targeted tests/checks.

Output requirements:

- Summarize mutation-flow and realtime integration changes.
- Note any user-visible loading/success/error behavior changes.

## What This Skill Does

Describes the required patterns for "manage" pages (community manage, event manage, etc.) that let admins perform mutations. Getting this wrong causes page-blanking loading states that break the admin UX.

## Common Scenarios

- Building a new community or event manage page
- Adding mutation buttons (invite, kick, add, remove) to an existing manage page
- Implementing loading/success/error feedback for admin actions
- Connecting realtime subscriptions to a manage-page view

---

## Use Local `actionState`, Not Store-Level Loading

**Never** call store actions that set `isCommunityLoading` or `isEventLoading` for individual mutations on a manage page. Those flags blank the whole page with a "Loading..." screen.

All mutations must go through a local `actionState` object via the `runCommunityAction` / `runAction` helper that only shows inline feedback:

```typescript
// ✅ GOOD: local action state — only a button/banner changes
function onRemoveEventClick(eventId: string): void {
	void runCommunityAction({
		key: `remove-event:${eventId}`,
		action: () => postJson(apiCommunityEventRemovePath, { community_id, event_id: eventId }),
		successMessage: "Event removed successfully",
		setActionState,
		refreshFn: refreshCommunity,
	});
}

// ❌ BAD: store action that calls setCommunityLoading(true) — blanks the page
function onSetActiveEventClick(eventId: string | undefined): void {
	void Effect.runPromise(setActiveEventForCommunity(communityId, eventId));
}
```

Helper locations:

- **Community actions**: `react/src/community/manage/community-manage-view/runCommunityAction.ts`
- **Event actions**: `react/src/event/manage/runAction.ts`

Both helpers handle the full loading → success/error cycle locally.

---

## Realtime is the Primary UI Update Path

After a mutation succeeds, the Supabase realtime subscription updates the UI. The `refreshFn` passed to `runCommunityAction`/`runAction` is a **silent fallback only** — it uses `{ silent: true }` so it does not trigger `isCommunityLoading`:

```typescript
async function refreshCommunity(): Promise<void> {
	// silent: true prevents isCommunityLoading from going true
	await Effect.runPromise(fetchCommunityBySlug(community_slug, { silent: true }));
}
```

Always ensure the manage page has active realtime subscriptions (see `useCommunityManageSubscriptions`, `useEventCommunityManagement`). The refresh is belt-and-suspenders, not the primary update path.

---

## Exclusion Lists in Search Dropdowns Filter by Active Status

When building "already-added" exclusion sets for search dropdowns, filter out `"kicked"` records so those users/events remain selectable for re-invite:

```typescript
// ✅ GOOD: kicked users can be re-invited
excludeUserIds={members
  .filter((member) => member.status !== "kicked")
  .map((member) => member.user_id)}

// ❌ BAD: blocks re-inviting kicked users
excludeUserIds={members.map((member) => member.user_id)}
```

The same applies to event participants (`status !== "kicked"`).

---

## Quick Checklist

- [ ] All mutations use `runCommunityAction` or `runAction` (not store-level loading flags)
- [ ] `refreshFn` passes `{ silent: true }` to the fetch call
- [ ] Realtime subscription is active on the page
- [ ] Kicked members are excluded from exclusion lists (not from re-invite eligibility)

## References

- [Split hooks over prop spreading](/docs/component-patterns.md#split-hooks-over-prop-spreading) — shell/body hook pattern for manage views

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If data access paths use Supabase client helpers, also load `supabase-client-patterns`.
- If realtime update behavior regresses, also load `realtime-rls-debugging`.
