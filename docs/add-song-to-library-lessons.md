# Add Song to Library: Lessons Learned

Lessons from debugging and fixing the add-song-to-library flow (FK violation, UI not updating). These patterns apply when integrating API endpoints with the React client.

## 1. API response shape: extract `data` before validation

`handleHttpEndpoint` wraps success responses in `{ success: true, data }`:

```typescript
// api/src/http/handleHttpEndpoint.ts
const result = userOnSuccess ? userOnSuccess(data) : { success: true, data };
return ctx.json(result);
```

Clients must extract `data` before validating or using the payload. Passing the full response object to validation (e.g. `guardAsSongLibraryEntry(responseJson)`) will fail because `song_id` and other fields live inside `data`, not at the top level.

**Fix**: Extract `response.data` (or handle the envelope) before validation:

```typescript
const responseData =
	typeof responseJson === "object" && responseJson !== null && "data" in responseJson
		? (responseJson as { data: unknown }).data
		: responseJson;
const output = guardAsSongLibraryEntry(responseData, "server response");
```

## 2. Supabase constraint failures do not reject

Supabase/Postgrest resolves with `{ data: null, error }` on FK violations and other constraint errors—it does not reject the promise. Code that relies on `Effect.tryPromise` catching rejections will miss these errors.

**Implication**: Always check `result.error` after Supabase mutations. The insert "succeeds" from the promise perspective even when the database rejects the operation.

## 3. Schema relationships inform repair logic

`song_public` has a foreign key to `song`. So a valid `song_public` row implies a corresponding `song` row exists. If `song_library` insert fails with `song_library_song_id_fkey`, the `song` row is missing. A repair that looks up `song_public` is unnecessary—if `song_public` had the row, `song` would too.

**Fix**: Use data already in the request (e.g. `song_owner_id`) to create the missing `song` row and retry, rather than depending on a `song_public` lookup.

## 4. Repair paths for known failure modes

When a specific failure mode is understood (e.g. FK violation), add a targeted repair path: detect the error, fix the underlying data, and retry. This keeps the feature working while root cause is investigated.

Example: on `song_library_song_id_fkey`, insert the missing `song` row with `song_id` and `user_id: song_owner_id`, then retry the library insert.

## 5. Success at API does not guarantee correct UX

A 200 response does not mean the client updated state correctly. In this case, the API succeeded but validation failed silently, so `addSongLibraryEntry` never ran and the UI did not reflect the new library entry. Trace the full path: API response → parsing → validation → state update.

## Related

- `api/src/http/handleHttpEndpoint.ts` — response envelope
- `react/src/song-library/slice/song-add/addSongToSongLibrary.ts` — client extraction and validation
- `api/src/song-library/addSongToLibrary.ts` — main handler
- `api/src/song-library/attemptSongLibraryRepair.ts` — FK repair logic
