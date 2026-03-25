# Community Library Feature Plan

A dedicated `community_library` table and full supporting stack, mirroring `event_library` exactly.

## Motivation

- Communities currently have no user library table (`ITEM_TYPE_CONFIG.community.libraryTable` is `undefined`).
- Tag counts for communities are always 0 because there is nothing to filter against.
- Users have no first-class way to "save" a community to a personal collection the same way they save events, songs, playlists, and images.

The existing `CommunityLibraryPage` / `CommunityLibrary` / `useCommunityLibrary` fetches communities the user is a **member** of (via `community_user` + `/api/communities/library`). That concept is separate — membership vs. explicit personal library. This feature adds the latter.

---

## Architecture constraints

### All mutations are server-side only

The React client **never writes directly to Supabase**. Add and remove operations POST to API endpoints:

```
POST /api/community-library/add    { community_id }
POST /api/community-library/remove { community_id }
```

The API handler looks up `community_owner_id` from `community_public`, then inserts/deletes using the service-role key. The client only learns of the result via the realtime subscription below.

### All display state is driven by realtime

On mount `useCommunityLibrary` does two things in parallel:

1. **Initial fetch** — `fetchCommunityLibraryEffect` reads the current `community_library` rows (with `community_public!inner` join) to populate the store immediately.
2. **Two realtime subscriptions** that keep the store live from that point on:
   - **`community_library` channel** — INSERT adds an entry; DELETE removes it.
   - **`community_public` channel** (filtered to IDs currently in the library) — UPDATE refreshes community metadata (community_name, community_slug, etc.) for entries already in the store.

Both subscriptions are cleaned up on unmount or route change. RLS ensures each subscription and fetch only delivers the current user's rows. The UI re-renders reactively from the Zustand store — there is no local component state for library data.

---

## Layer 1 — Database migrations

### `supabase/migrations/20260321000000_create_community_library_table.sql`

Creates the `community_library` table with:

| Column               | Type                        | Notes                                                                                                       |
| -------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `user_id`            | `uuid NOT NULL`             | FK → `user(user_id)` CASCADE                                                                                |
| `community_id`       | `uuid NOT NULL`             | FK → `community(community_id)` CASCADE; FK → `community_public(community_id)` CASCADE (for PostgREST joins) |
| `community_owner_id` | `uuid NOT NULL`             | Denormalized owner; FK → `user(user_id)` CASCADE                                                            |
| `created_at`         | `timestamptz DEFAULT now()` |                                                                                                             |

- Primary key: `(user_id, community_id)`
- `REPLICA IDENTITY FULL`
- Indexes on `user_id` and `community_id`
- RLS: SELECT / INSERT / DELETE own rows via `auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'`
- No UPDATE policy (append-only like `event_library`)

### `supabase/migrations/20260321000001_enable_community_library_realtime.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_library;
```

### `supabase/migrations/20260321000002_rename_community_public_name_slug_columns.sql`

Rename `community_public.name` → `community_name` and `community_public.slug` → `community_slug`
to match the naming pattern of all other item types (`event_name`/`event_slug`, `song_name`/`song_slug`, etc.).

PostgreSQL automatically rewrites the `community_name_format` and `community_slug_format` CHECK
constraints and the `community_slug_unique` UNIQUE constraint when columns are renamed — no manual
constraint changes needed.

**TypeScript impact** — every reference to `community.name` or `community.slug` must be updated
to `community.community_name` / `community.community_slug`. Exact files:

| File                                                                            | What to change                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `react/src/community/community-types.ts`                                        | `CommunityEntry.name` → `community_name`, `CommunityEntry.slug` → `community_slug` |
| `react/src/community/fetch/normalizeCommunityEntry.ts`                          | mapping keys                                                                       |
| `react/src/community/view/CommunityViewHeader.tsx`                              | field references                                                                   |
| `react/src/community/view/CommunityView.tsx`                                    | field references                                                                   |
| `react/src/community/library/CommunityLibrary.tsx`                              | field references (membership component)                                            |
| `react/src/community/manage/community-manage-view/body/CommunityManageBody.tsx` | field references                                                                   |
| `react/src/community/form/useCommunityForm.ts`                                  | field reads/writes                                                                 |
| `react/src/community/form/CommunityForm.tsx`                                    | field references                                                                   |
| `api/src/community/communityLibrary.ts`                                         | column name in query result mapping                                                |

Note: Several event-side files (`react/src/event/fetch/fetchEventCommunities.ts`,
`react/src/invitation/mapCommunityInvitations.ts`, `react/src/event/manage/...CommunityRow.tsx`)
already use `community_name` / `community_slug` — they were written ahead of the rename and
require no changes.

---

## Layer 2 — Shared paths

**File: `shared/src/paths.ts`** — add:

```ts
export const apiCommunityLibraryAddPath = "/api/community-library/add";
export const apiCommunityLibraryRemovePath = "/api/community-library/remove";
```

> The existing `apiCommunityLibraryPath = "/api/communities/library"` is unchanged — it remains the membership (community_user) API.

---

## Layer 3 — React module `react/src/community-library/`

Full directory mirroring `react/src/event-library/`.

### Types — `community-library-types.ts`

```ts
export type CommunityLibrary = {
	user_id: string;
	community_id: string;
	community_owner_id: string;
	created_at: string;
};

export type CommunityLibraryEntry = CommunityLibrary & {
	community_public?: {
		community_id: string;
		community_name: string;
		community_slug: string;
		owner_id: string;
		owner?: { username: string };
	};
};

export type AddCommunityToLibraryRequest = { community_id: string };
export type RemoveCommunityFromLibraryRequest = { community_id: string };

export type CommunityLibraryState = {
	communityLibraryEntries: Record<string, CommunityLibraryEntry>;
	isCommunityLibraryLoading: boolean;
	communityLibraryError?: string | undefined;
};

export type CommunityLibrarySliceBase = {
	isInCommunityLibrary: (communityId: string) => boolean;
};
```

### Files to create

```
react/src/community-library/
  community-library-types.ts
  community-library-types.test.ts
  useCommunityLibrary.ts                         ← mirrors useEventLibrary.ts
  useCommunityLibrary.test.tsx

  slice/
    CommunityLibrarySlice.type.ts
    createCommunityLibrarySlice.ts
    createCommunityLibrarySlice.test.ts
    makeCommunityLibrarySlice.test-util.ts
    makeCommunityLibrarySlice.test-util.test.ts

  guards/
    isCommunityLibraryEntry.ts
    isCommunityLibraryEntry.test.ts
    guardAsCommunityLibraryEntry.ts
    guardAsCommunityLibraryEntry.test.ts

  fetch/
    fetchCommunityLibraryEffect.ts               ← queries community_library with community_public!inner join
    fetchCommunityLibraryEffect.test.ts

  community-add/
    addCommunityToLibraryEffect.ts               ← POST apiCommunityLibraryAddPath
    addCommunityToLibraryEffect.test.ts

  community-remove/
    removeCommunityFromLibraryEffect.ts          ← POST apiCommunityLibraryRemovePath
    removeCommunityFromLibraryEffect.test.ts

  subscribe/
    subscribeToCommunityLibraryEffect.ts         ← subscribes to community_library table
    subscribeToCommunityLibraryEffect.test.ts
    handleCommunityLibrarySubscribeEvent.ts      ← INSERT/UPDATE → addEntry, DELETE → removeEntry
    handleCommunityLibrarySubscribeEvent.test.ts
    subscribeToCommunityPublicForLibraryEffect.ts ← subscribes to community_public
    subscribeToCommunityPublicForLibraryEffect.test.ts
    handleCommunityPublicSubscribeEvent.ts
    handleCommunityPublicSubscribeEvent.test.ts

  CommunityLibrary.tsx                           ← main component (loading/empty/error/grid)
  CommunityLibraryLoadingState.tsx
  CommunityLibraryEmptyState.tsx
  CommunityLibraryErrorState.tsx

  card/
    CommunityLibraryCard.tsx
    CommunityLibraryCardDisplay.tsx              ← View, Manage, Edit (if owned), Delete/Remove
    CommunityLibraryCardDisplay.test.tsx
    CommunityLibraryCardConfirmation.tsx
    useCommunityLibraryCard.ts
    useCommunityLibraryCard.test.tsx
    useCommunityLibraryCardDisplay.ts
    useCommunityLibraryCardDisplay.test.tsx

  test-utils/
    makeCommunityLibraryEntry.mock.ts
    makeCommunityLibraryEntry.mock.test.ts
```

### Key implementation notes

**`fetchCommunityLibraryEffect.ts`** — Supabase query:

```ts
callSelect(client, "community_library", {
	cols: "*, community_public!inner(community_id, community_name, community_slug, owner_id, owner:user_public!owner_id(username))",
});
```

**`CommunityLibraryCardDisplay.tsx`** — action links (community has no slideshow/slide-manager):

- "View Community" → `/${communityViewPath}/${entry.community_public?.slug}`
- "Manage" → `/${communityViewPath}/${entry.community_public?.slug}/${communityManagePath}`
- "Edit" (if owned) → `/${dashboardPath}/${communityEditPath}/${entry.community_id}`
- "Delete" (if owned, shows confirmation) / "Remove" (if not owned, direct)

---

## Layer 4 — API handlers `api/src/community-library/`

### `addCommunityToLibrary.ts`

Mirrors `addEventToLibrary.ts`:

1. Parse + validate `{ community_id: string }` from request body
2. Verify user session → get `userId`
3. Look up `community_owner_id` from `community_public` where `community_id = req.community_id`
4. Insert `{ user_id, community_id, community_owner_id }` into `community_library` using service key
5. Return the inserted `CommunityLibrary` row

### `removeCommunityFromLibrary.ts`

Mirrors `removeEventFromLibrary.ts`:

1. Parse + validate `{ community_id: string }`
2. Verify user session
3. Delete from `community_library` where `user_id = userId AND community_id = req.community_id`

---

## Layer 5 — API route registration

**`api/src/server.ts`**:

- Import `apiCommunityLibraryAddPath`, `apiCommunityLibraryRemovePath` from paths
- Import `addCommunityToLibraryHandler`, `removeCommunityFromLibraryHandler`
- Register:
  ```ts
  app.post(apiCommunityLibraryAddPath, handleHttpEndpoint(addCommunityToLibraryHandler));
  app.post(apiCommunityLibraryRemovePath, handleHttpEndpoint(removeCommunityFromLibraryHandler));
  ```

---

## Layer 6 — App store wiring

**`react/src/app-store/AppSlice.type.ts`**:

- Add `import type { CommunityLibrarySlice } from "@/react/community-library/slice/CommunityLibrarySlice.type";`
- Add `CommunityLibrarySlice` to the `AppSlice` intersection type (after `CommunitySlice`)

**`react/src/app-store/config/sliceFactories.ts`**:

- Import `createCommunityLibrarySlice`
- Add it to `sliceFactories` after `createCommunitySlice`

---

## Layer 7 — Update `CommunityLibraryPage`

**`react/src/pages/CommunityLibraryPage.tsx`**:

- Replace import of `CommunityLibrary` from `@/react/community/library/CommunityLibrary`
  with `@/react/community-library/CommunityLibrary`

---

## Layer 8 — Fix item-type and tag counts

**`react/src/tag/item-type.ts`**:

```ts
community: {
    tagTable: "community_tag",
    idCol: "community_id",
    libraryTable: "community_library",   // was: undefined
},
```

**`react/src/tag-library/fetch/fetchTagLibraryCountsEffect.ts`**:
Replace:

```ts
community: Effect.succeed([] as string[]),
```

with:

```ts
community: fetchLibraryItemIds(client, "community"),
```

(Valid now that `ITEM_TYPE_CONFIG.community.libraryTable` is no longer `undefined`.)

Also update the `satisfies` constraint check in `fetchSlugsByItemType.ts` if it infers `undefined` for community's library — it should resolve automatically once `item-type.ts` is fixed.

---

## File count summary

| Layer                    | New files | Modified files                                       |
| ------------------------ | --------- | ---------------------------------------------------- |
| Migrations               | 2         | 0                                                    |
| Shared paths             | 0         | 1 (`paths.ts`)                                       |
| React module             | ~26       | 1 (`CommunityLibraryPage.tsx`)                       |
| API handlers             | 2         | 1 (`server.ts`)                                      |
| App store                | 0         | 2 (`AppSlice.type.ts`, `sliceFactories.ts`)          |
| `item-type` / tag counts | 0         | 2 (`item-type.ts`, `fetchTagLibraryCountsEffect.ts`) |

**~30 new files, ~7 modified files**

---

## Implementation order

1. Migration files (prerequisite for everything)
2. `shared/src/paths.ts` (needed by both API and React)
3. `react/src/community-library/community-library-types.ts`
4. `react/src/community-library/guards/`
5. `react/src/community-library/slice/`
6. `api/src/community-library/` handlers
7. `api/src/server.ts` route registration
8. `react/src/community-library/fetch/`
9. `react/src/community-library/community-add/` and `community-remove/`
10. `react/src/community-library/subscribe/`
11. `react/src/community-library/useCommunityLibrary.ts`
12. `react/src/community-library/card/` and UI components
13. App store wiring (AppSlice + sliceFactories)
14. `CommunityLibraryPage.tsx` update
15. `item-type.ts` + `fetchTagLibraryCountsEffect.ts` fix
16. Run `npm run lint` and fix any issues
