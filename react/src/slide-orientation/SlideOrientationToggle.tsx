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

	function getVariant(value: SlideOrientationPreferenceType): "outlineSecondary" | "primary" {
		return slideOrientationPreference === value ? "primary" : "outlineSecondary";
	}

	return (
		<div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
			{showLabel ? (
				<span className="text-sm text-gray-300">{t("slideOrientation.label", "Slides")}</span>
			) : undefined}
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
}
