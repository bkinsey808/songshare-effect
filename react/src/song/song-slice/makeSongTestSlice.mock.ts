import type { Api } from "@/react/app-store/app-store-types";

import makeSongSubscribeSlice from "./makeSongSubscribeSlice.mock";
import { createSongSubscribeSlice, type SongSubscribeSlice } from "./song-slice";

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
