import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import fetchTagLibraryFn from "../fetch/fetchTagLibraryEffect";
import subscribeToTagLibraryFn from "../subscribe/subscribeToTagLibraryEffect";
import type { TagLibraryEntry } from "./TagLibraryEntry.type";
import type { TagLibraryState } from "./TagLibraryState.type";
import type { TagLibrarySlice } from "./TagLibrarySlice.type";

const initialState: TagLibraryState = {
	tagLibraryEntries: {} as Record<string, TagLibraryEntry>,
	isTagLibraryLoading: false,
	tagLibraryError: undefined,
};

/**
 * Factory that creates the Zustand slice for tag library state and actions.
 * The returned slice exposes Effects for subscribing to realtime updates
 * and local setters used by those Effects.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `TagLibrarySlice`.
 */
export default function createTagLibrarySlice(
	set: Set<TagLibrarySlice>,
	get: Get<TagLibrarySlice>,
	api: Api<TagLibrarySlice>,
): TagLibrarySlice {
	void api;
	sliceResetFns.add(() => {
		const { tagLibraryUnsubscribe } = get();
		if (tagLibraryUnsubscribe) {
			tagLibraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		fetchTagLibrary: (): Effect.Effect<void, Error> => fetchTagLibraryFn(get),

		subscribeToTagLibrary: (): Effect.Effect<() => void, Error> => subscribeToTagLibraryFn(get),

		isInTagLibrary: (tagSlug: string) => {
			const { tagLibraryEntries } = get();
			return tagSlug in tagLibraryEntries;
		},

		getTagLibrarySlugs: () => {
			const { tagLibraryEntries } = get();
			return Object.keys(tagLibraryEntries);
		},

		setTagLibraryEntries: (entries: Record<string, TagLibraryEntry>) => {
			set({ tagLibraryEntries: entries });
		},

		addTagLibraryEntry: (entry: TagLibraryEntry) => {
			set((state) => ({
				tagLibraryEntries: {
					...state.tagLibraryEntries,
					[entry.tag_slug]: entry,
				},
			}));
		},

		removeTagLibraryEntry: (tagSlug: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.tagLibraryEntries).filter(([slug]) => slug !== tagSlug),
				);
				return { tagLibraryEntries: newEntries };
			});
		},

		setTagLibraryLoading: (loading: boolean) => {
			set({ isTagLibraryLoading: loading });
		},

		setTagLibraryError: (error: string | undefined) => {
			set({ tagLibraryError: error });
		},
	};
}
