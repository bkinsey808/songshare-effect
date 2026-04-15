import type { Api } from "@/react/app-store/app-store-types";

import makeSongSubscribeSlice from "./makeSongSubscribeSlice.mock";
import { createSongSubscribeSlice, type SongSubscribeSlice } from "./song-slice";

/**
 * Create a mutable `SongSubscribeSlice` harness for tests.
 *
 * @param initialState - Optional partial state to merge into the base slice.
 * @returns The created slice plus `getState` and `setState` helpers.
 */
export default function makeSongTestSlice(initialState?: Partial<SongSubscribeSlice>): {
	slice: SongSubscribeSlice;
	getState: () => SongSubscribeSlice;
	setState: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	) => void;
} {
	const getBase = makeSongSubscribeSlice();
	let state: SongSubscribeSlice = { ...getBase(), ...initialState };

	/**
	 * Update the internal test slice state.
	 *
	 * @param partial - Partial state or updater function to merge into the slice
	 * @returns void
	 */
	function set(
		partial:
			| Partial<SongSubscribeSlice>
			| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	): void {
		if (typeof partial === "function") {
			state = {
				...state,
				...(partial as (prev: SongSubscribeSlice) => Partial<SongSubscribeSlice>)(state),
			};
		} else {
			state = { ...state, ...partial };
		}
	}

	/**
	 * Retrieve the current mutable slice state for assertions inside tests.
	 *
	 * @returns The current `SongSubscribeSlice` state
	 */
	function get(): SongSubscribeSlice {
		return state;
	}

	const api: Api<SongSubscribeSlice> = {
		setState: (
			partial:
				| Partial<SongSubscribeSlice>
				| ((prevState: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
		) => {
			set(partial);
		},
		getState: get,
		getInitialState: () => get(),
		subscribe: () => () => undefined,
	};

	const slice = createSongSubscribeSlice(set, get, api);
	// Ensure state reflects the created slice shape
	state = get();

	return { slice, getState: get, setState: set };
}
