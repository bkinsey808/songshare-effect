import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import useLocale from "@/react/lib/language/locale/useLocale";
import {
	SlideOrientationPreference,
	coerceSlideOrientationPreference,
	type SlideOrientationPreferenceType,
} from "@/shared/user/slideOrientationPreference";

import useSetSlideOrientationPreference from "./useSetSlideOrientationPreference";
import useSlideOrientationPreference from "./useSlideOrientationPreference";

type SlideOrientationSelectProps = Readonly<{
	className?: string;
}>;

export default function SlideOrientationSelect({
	className = "",
}: SlideOrientationSelectProps): ReactElement | undefined {
	const currentUser = useCurrentUser();
	const { t } = useLocale();
	const { slideOrientationPreference } = useSlideOrientationPreference();
	const setSlideOrientationPreference = useSetSlideOrientationPreference();

	if (currentUser === undefined) {
		return undefined;
	}

	function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const nextPreference: SlideOrientationPreferenceType = coerceSlideOrientationPreference(
			event.target.value,
		);
		void setSlideOrientationPreference(nextPreference);
	}

	return (
		<label className={`flex items-center gap-2 text-sm text-gray-300 ${className}`.trim()}>
			<span>{t("slideOrientation.label", "Slides")}</span>
			<select
				className="rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
				value={slideOrientationPreference}
				onChange={handleChange}
				aria-label={t("slideOrientation.label", "Slides")}
				data-testid="slide-orientation-select"
			>
				<option value={SlideOrientationPreference.portrait}>
					{t("slideOrientation.portrait", "Portrait")}
				</option>
				<option value={SlideOrientationPreference.landscape}>
					{t("slideOrientation.landscape", "Landscape")}
				</option>
				<option value={SlideOrientationPreference.system}>
					{t("slideOrientation.system", "System")}
				</option>
			</select>
		</label>
	);
}
