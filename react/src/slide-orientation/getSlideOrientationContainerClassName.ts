import {
	ResolvedSlideOrientation,
	type ResolvedSlideOrientationType,
} from "@/shared/user/slideOrientationPreference";

export default function getSlideOrientationContainerClassName(
	slideOrientation: ResolvedSlideOrientationType,
): string {
	return slideOrientation === ResolvedSlideOrientation.portrait
		? "mx-auto w-full max-w-xl"
		: "mx-auto w-full max-w-5xl";
}
