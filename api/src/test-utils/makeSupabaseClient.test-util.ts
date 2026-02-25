import type { createClient } from "@supabase/supabase-js";

import {
	createEventLibraryMock,
	type EventLibraryMockOpts,
} from "./supabase-mocks/createEventLibraryMock.test-util";
import { createEventMock, type EventMockOpts } from "./supabase-mocks/createEventMock.test-util";
import {
	createEventPublicMock,
	type EventPublicMockOpts,
} from "./supabase-mocks/createEventPublicMock.test-util";
import {
	createEventUserMock,
	type EventUserMockOpts,
} from "./supabase-mocks/createEventUserMock.test-util";
import {
	createPlaylistLibraryMock,
	type PlaylistLibraryMockOpts,
} from "./supabase-mocks/createPlaylistLibraryMock.test-util";
import {
	createPlaylistMock,
	type PlaylistMockOpts,
} from "./supabase-mocks/createPlaylistMock.test-util";
import {
	createPlaylistPublicMock,
	type PlaylistPublicMockOpts,
} from "./supabase-mocks/createPlaylistPublicMock.test-util";
import { createUserMock, type UserMockOpts } from "./supabase-mocks/createUserMock.test-util";
import {
	createUserPublicMock,
	type UserPublicMockOpts,
} from "./supabase-mocks/createUserPublicMock.test-util";

/**
 * Options to customize the fake Supabase client returned for tests.
 */
type MakeSupabaseClientOpts = UserPublicMockOpts &
	UserMockOpts &
	EventMockOpts &
	EventPublicMockOpts &
	EventLibraryMockOpts &
	EventUserMockOpts &
	PlaylistMockOpts &
	PlaylistPublicMockOpts &
	PlaylistLibraryMockOpts;

function makeSupabaseClient(opts: MakeSupabaseClientOpts = {}): ReturnType<typeof createClient> {
	const fake = {
		from: (table: string): unknown => {
			const tables: Record<string, unknown> = {
				user_public: createUserPublicMock(opts),
				user: createUserMock(opts),
				event: createEventMock(opts),
				event_public: createEventPublicMock(opts),
				event_library: createEventLibraryMock(opts),
				event_user: createEventUserMock(opts),
				playlist: createPlaylistMock(opts),
				playlist_public: createPlaylistPublicMock(opts),
				playlist_library: createPlaylistLibraryMock(opts),
			};
			return tables[table];
		},
	};

	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast to Supabase client */
	return fake as unknown as ReturnType<typeof createClient>;
}

export default makeSupabaseClient;
export type { MakeSupabaseClientOpts };
