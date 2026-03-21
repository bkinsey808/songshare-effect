# Tags Feature

Tags are global, kebab-cased slugs (e.g. `indie-rock`, `worship-2024`) that can be applied to songs, playlists, events, communities, and images. Users build a personal **tag library** — a bookmarked list of tags — for quick navigation to items they care about.

---

## Core Rules

- Tags are **kebab-case only**: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`
- Tags have **no owner** — they are global, shared entities
- Only the **item owner** can add/remove tags on their item (enforced at API and edit-page level)
- Tag-item associations are visible to all authenticated users
- Tags are displayed (read-only) on view pages; managed on edit pages
- Tags are not shareable (no share button)
- Tag pages require authentication

---

## Data Model

Seven tables underpin the feature:

| Table | Purpose |
|---|---|
| `tag` | Global tag registry. A row is created (upserted) on first use of a slug. |
| `song_tag` | Junction: song ↔ tag |
| `playlist_tag` | Junction: playlist ↔ tag |
| `event_tag` | Junction: event ↔ tag |
| `community_tag` | Junction: community ↔ tag |
| `image_tag` | Junction: image ↔ tag |
| `tag_library` | Per-user bookmark list of tags (`user_id`, `tag_slug`) |

All junction tables cascade-delete when the parent item or tag is deleted. RLS allows any authenticated user to read; only the item owner can insert/delete junction rows. `tag_library` rows are private to each user.

Migration: `supabase/migrations/20260320000000_create_tag_tables.sql`

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/tags/add-to-item` | Upsert tag into `tag`, insert into `*_tag`. Auth: item owner only. |
| `POST` | `/api/tags/remove-from-item` | Delete from `*_tag`. Auth: item owner only. |
| `GET` | `/api/tags/search?q=` | Search the caller's own `tag_library` by slug substring. Used for autocomplete. |
| `POST` | `/api/tag-library/add` | Add a tag slug to the user's tag library. |
| `POST` | `/api/tag-library/remove` | Remove a tag slug from the user's tag library. |

---

## Frontend Structure

```
react/src/tag-library/
  TagBadge.tsx                  # Single tag pill (read-only, links to tag view)
  TagList.tsx                   # Row of TagBadge pills; used on view pages
  TagInput.tsx                  # Autocomplete input with removable chips; used on edit pages
  TagLibrary.tsx                # Tag library page body (list of bookmarked tags)
  useTagLibrary.ts              # Hook: fetches + subscribes to tag library slice
  useItemTags.ts                # Hook: fetches item tags for edit forms; exposes saveTags()
  fetchItemTagsRequest.ts       # Direct Supabase read of *_tag for a given item
  saveItemTagsRequest.ts        # Diffs original/next tags and calls add/remove API
  searchTagsRequest.ts          # Calls /api/tags/search for TagInput autocomplete
  fetch/fetchTagLibraryEffect.ts
  subscribe/subscribeToTagLibraryEffect.ts
  slice/createTagLibrarySlice.ts
  slice/TagLibrarySlice.type.ts
  slice/tag-library-types.ts
  guards/isTagLibraryEntry.ts

react/src/pages/
  TagLibraryPage.tsx            # /en/dashboard/tag-library
  TagViewPage.tsx               # /en/dashboard/tag/:tag_slug

react/src/lib/design-system/icons/
  TagIcon.tsx                   # "#" SVG icon
```

### Edit pages

Each edit form (song, playlist, event, community, image) uses `useItemTags(itemType, itemId)` to load and save tags. The hook:
1. Fetches existing tags from the `*_tag` table on mount
2. Tracks the original snapshot in a ref
3. Exposes `saveTags(itemId)` which diffs original vs. current and fires the add/remove API calls

`TagInput` renders the current tags as removable chips and provides debounced autocomplete (250 ms) against the user's own tag library.

### View pages

Each view page (song, playlist, event, community, image) fetches the item's tags via `fetchItemTagsRequest` in a `useEffect` and renders them with `TagList`. The tags are read-only links to each tag's view page.

### Tag library state (Zustand)

The `tag-library` slice lives in the global app store and mirrors the `song-library` / `playlist-library` pattern: it holds `tagLibraryEntries` (a `Record<string, TagLibraryEntry>`), fetches on mount, and subscribes to Supabase Realtime for live updates.

---

## Routes

| Path | Component |
|---|---|
| `/en/dashboard/tag-library` | `TagLibraryPage` |
| `/en/dashboard/tag/:tag_slug` | `TagViewPage` |

Navigation entry is in `NavigationLinksCard` (`data-testid="navigation-tag-library"`).

---

## Design Decisions

**Autocomplete is scoped to the user's own tag library, not all global tags.**
Showing all global tags would surface irrelevant noise. Users find their own previously-used tags most useful when tagging new items.

**Tags persist even when no items use them.**
Deleting a tag when the last item association is removed would silently drop users' library bookmarks. Tags in `tag` and `tag_library` are kept forever; orphaned global tags are harmless.

**Slug-only — no separate display name.**
A display name would require a separate field, a creation form, and an owner. Slugs are self-describing enough and eliminate that complexity entirely.

**Tag saves are batched with the item save.**
Tag changes are held in local state on the edit form and flushed when the user clicks Save. This avoids partial saves and keeps the UX simple — one Save button does everything.

**Tag view page is stub/deferred.**
The view page (`TagViewPage`) currently shows a placeholder. Displaying library items by tag requires cross-slice queries (tag + each entity library) that are better tackled alongside a broader pagination effort.
