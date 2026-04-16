import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
    ResolvedSlideOrientation,
    SlideOrientationPreference,
} from "@/shared/user/slideOrientationPreference";

import useSystemSlideOrientation from "./useSystemSlideOrientation";

/**
 * Hook that returns the effective slide orientation for the app, whether the
 * resolved orientation is coming from system settings, and the raw preference
 * value.
 *
 * @returns object with `effectiveSlideOrientation`, `isSystemSlideOrientation`,
 * and `slideOrientationPreference` fields
 */
export default function useSlideOrientationPreference(): {
	effectiveSlideOrientation: "landscape" | "portrait";
	isSystemSlideOrientation: boolean;
	slideOrientationPreference: "landscape" | "portrait" | "system";
} {
	const currentUser = useCurrentUser();
	const systemSlideOrientation = useSystemSlideOrientation();
	const slideOrientationPreference =
		currentUser?.slideOrientationPreference ?? SlideOrientationPreference.system;

	if (slideOrientationPreference === SlideOrientationPreference.system) {
		return {
			effectiveSlideOrientation: systemSlideOrientation,
			isSystemSlideOrientation: true,
			slideOrientationPreference,
		};
	}

	return {
		effectiveSlideOrientation:
			slideOrientationPreference === SlideOrientationPreference.portrait
				? ResolvedSlideOrientation.portrait
				: ResolvedSlideOrientation.landscape,
		isSystemSlideOrientation: false,
		slideOrientationPreference,
	};
}
