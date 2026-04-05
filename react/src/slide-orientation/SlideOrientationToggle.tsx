import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import Button from "@/react/lib/design-system/Button";
import useLocale from "@/react/lib/language/locale/useLocale";
import {
	SlideOrientationPreference,
	type SlideOrientationPreferenceType,
} from "@/shared/user/slideOrientationPreference";

import useSetSlideOrientationPreference from "./useSetSlideOrientationPreference";
import useSlideOrientationPreference from "./useSlideOrientationPreference";

type SlideOrientationToggleProps = Readonly<{
	className?: string;
	showLabel?: boolean;
}>;

/**
 * Renders the signed-in user's slide-orientation preference controls.
 *
 * @param className - Optional layout classes for the wrapper
 * @param showLabel - Whether to render the field label above the controls
 * @returns Orientation toggle controls, or `undefined` when no user is signed in
 */
export default function SlideOrientationToggle({
	className = "",
	showLabel = false,
}: SlideOrientationToggleProps): ReactElement | undefined {
	const currentUser = useCurrentUser();
	const { t } = useLocale();
	const { slideOrientationPreference } = useSlideOrientationPreference();
	const setSlideOrientationPreference = useSetSlideOrientationPreference();

	if (currentUser === undefined) {
		return undefined;
	}

	/**
	 * Chooses the button variant for a given preference option.
	 *
	 * @param value - Preference value represented by the button
	 * @returns Design-system button variant for the current selection state
	 */
	function getVariant(value: SlideOrientationPreferenceType): "outlineSecondary" | "primary" {
		return slideOrientationPreference === value ? "primary" : "outlineSecondary";
	}

	const buttons = (
		<div className="flex flex-wrap items-center gap-2">
			<Button
				size="compact"
				variant={getVariant(SlideOrientationPreference.landscape)}
				onClick={() => {
					void setSlideOrientationPreference(SlideOrientationPreference.landscape);
				}}
				data-testid="slide-orientation-landscape"
			>
				{t("slideOrientation.landscape", "Landscape")}
			</Button>
			<Button
				size="compact"
				variant={getVariant(SlideOrientationPreference.portrait)}
				onClick={() => {
					void setSlideOrientationPreference(SlideOrientationPreference.portrait);
				}}
				data-testid="slide-orientation-portrait"
			>
				{t("slideOrientation.portrait", "Portrait")}
			</Button>
			<Button
				size="compact"
				variant={getVariant(SlideOrientationPreference.system)}
				onClick={() => {
					void setSlideOrientationPreference(SlideOrientationPreference.system);
				}}
				data-testid="slide-orientation-system"
			>
				{t("slideOrientation.system", "System")}
			</Button>
		</div>
	);

	if (showLabel) {
		return (
			<div className={`flex flex-col gap-1 text-sm text-gray-300 ${className}`.trim()}>
				<span>{t("slideOrientation.label", "Slides")}</span>
				{buttons}
			</div>
		);
	}

	return <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>{buttons}</div>;
}
