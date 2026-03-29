import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import {
	ResolvedSlideOrientation,
	SlideOrientationPreference,
} from "@/shared/user/slideOrientationPreference";

import useSystemSlideOrientation from "./useSystemSlideOrientation";

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
