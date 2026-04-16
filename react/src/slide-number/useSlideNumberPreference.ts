import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
    SlideNumberPreference,
    type SlideNumberPreferenceType,
} from "@/shared/user/slideNumberPreference";

/**
 * Hook that reads the current user's slide number preference.
 *
 * @returns An object with the raw `slideNumberPreference` and a boolean `showSlideNumber`
 */
export default function useSlideNumberPreference(): {
	slideNumberPreference: SlideNumberPreferenceType;
	showSlideNumber: boolean;
} {
	const currentUser = useCurrentUser();
	const slideNumberPreference = currentUser?.slideNumberPreference ?? SlideNumberPreference.hide;

	return {
		slideNumberPreference,
		showSlideNumber: slideNumberPreference === SlideNumberPreference.show,
	};
}
