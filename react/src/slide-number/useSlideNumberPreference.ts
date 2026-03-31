import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
	SlideNumberPreference,
	type SlideNumberPreferenceType,
} from "@/shared/user/slideNumberPreference";

export default function useSlideNumberPreference(): {
	slideNumberPreference: SlideNumberPreferenceType;
	showSlideNumber: boolean;
} {
	const currentUser = useCurrentUser();
	const slideNumberPreference =
		currentUser?.slideNumberPreference ?? SlideNumberPreference.hide;

	return {
		slideNumberPreference,
		showSlideNumber: slideNumberPreference === SlideNumberPreference.show,
	};
}
