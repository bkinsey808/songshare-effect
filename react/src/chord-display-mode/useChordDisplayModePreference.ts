import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import { ChordDisplayMode, type ChordDisplayModeType } from "@/shared/user/chordDisplayMode";

export default function useChordDisplayModePreference(): {
	chordDisplayMode: ChordDisplayModeType;
} {
	const currentUser = useCurrentUser();
	const chordDisplayMode = currentUser?.chordDisplayMode ?? ChordDisplayMode.roman;

	return {
		chordDisplayMode,
	};
}
