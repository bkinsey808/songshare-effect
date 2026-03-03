---
name: manage-page-patterns
description: Patterns for admin/manage pages (community manage, event manage) — local actionState, runCommunityAction/runAction helpers, realtime as primary update path. Use when building manage pages with mutations like invite, kick, add, or remove.
license: MIT
compatibility: React 18+, Effect-TS, Supabase Realtime
metadata:
  author: bkinsey808
  version: "1.0"
---

# Manage-Page Patterns Skill

## What This Skill Does

Describes the required patterns for "manage" pages (community manage, event manage, etc.) that let admins perform mutations. Getting this wrong causes page-blanking loading states that break the admin UX.

## When to Use

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
