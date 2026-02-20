import type { createClient } from "@supabase/supabase-js";

import { createEventMock, type EventMockOpts } from "./supabase-mocks/event";
import { createEventLibraryMock, type EventLibraryMockOpts } from "./supabase-mocks/event-library";
import { createEventPublicMock, type EventPublicMockOpts } from "./supabase-mocks/event-public";
import { createEventUserMock, type EventUserMockOpts } from "./supabase-mocks/event-user";
import { createUserMock, type UserMockOpts } from "./supabase-mocks/user";
import { createUserPublicMock, type UserPublicMockOpts } from "./supabase-mocks/user-public";

/**
 * Options to customize the fake Supabase client returned for tests.
 */
type MakeSupabaseClientOpts = UserPublicMockOpts &
	UserMockOpts &
	EventMockOpts &
	EventPublicMockOpts &
	EventLibraryMockOpts &
	EventUserMockOpts;

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
			};
			return tables[table];
		},
	};

	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast to Supabase client */
	return fake as unknown as ReturnType<typeof createClient>;
}

export default makeSupabaseClient;
export type { MakeSupabaseClientOpts };
