import {
    ResolvedSlideOrientation,
    type ResolvedSlideOrientationType,
} from "@/shared/user/slideOrientationPreference";

/**
 * Return container class names sized for the current slide orientation.
 *
 * @param slideOrientation - current resolved slide orientation
 * @returns Tailwind class string for container sizing
 */
export default function getSlideOrientationContainerClassName(
	slideOrientation: ResolvedSlideOrientationType,
): string {
	return slideOrientation === ResolvedSlideOrientation.portrait
		? "mx-auto w-full max-w-xl"
		: "mx-auto w-full max-w-5xl";
}
