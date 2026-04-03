import { startTransition } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import type { ChordDisplayModeType } from "@/shared/user/chordDisplayMode";

import saveChordDisplayMode from "./saveChordDisplayMode";

export default function useSetChordDisplayMode(): (
	chordDisplayMode: ChordDisplayModeType,
) => Promise<void> {
	const currentUser = useCurrentUser();
	const updateUserSessionUser = useAppStore((state) => state.updateUserSessionUser);

	return async function setChordDisplayMode(chordDisplayMode: ChordDisplayModeType): Promise<void> {
		if (currentUser === undefined) {
			return;
		}

		startTransition(() => {
			updateUserSessionUser({
				chord_display_mode: chordDisplayMode,
			});
		});

		try {
			const savedMode = await saveChordDisplayMode(chordDisplayMode);
			startTransition(() => {
				updateUserSessionUser({
					chord_display_mode: savedMode,
				});
			});
		} catch (error) {
			console.error("Failed to persist chord display mode:", error);
		}
	};
}
