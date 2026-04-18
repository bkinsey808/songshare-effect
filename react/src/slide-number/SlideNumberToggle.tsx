import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import Button from "@/react/lib/design-system/Button";
import useLocale from "@/react/lib/language/locale/useLocale";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";

import useSetSlideNumberPreference from "./useSetSlideNumberPreference";
import useSlideNumberPreference from "./useSlideNumberPreference";

type SlideNumberToggleProps = Readonly<{
	className?: string;
}>;

/**
 * Toggle button to show or hide slide numbers for the current user.
 *
 * @param className - Optional className forwarded to the button
 * @returns A `Button` ReactElement when a user is present, otherwise `undefined`
 */
export default function SlideNumberToggle({
	className = "",
}: SlideNumberToggleProps): ReactElement | undefined {
	const currentUser = useCurrentUser();
	const { t } = useLocale();
	const { slideNumberPreference } = useSlideNumberPreference();
	const setSlideNumberPreference = useSetSlideNumberPreference();

	if (currentUser === undefined) {
		return undefined;
	}

	const isShowing = slideNumberPreference === SlideNumberPreference.show;

	return (
		<Button
			size="compact"
			variant={isShowing ? "primary" : "outlineSecondary"}
			onClick={() => {
				void setSlideNumberPreference(
					isShowing ? SlideNumberPreference.hide : SlideNumberPreference.show,
				);
			}}
			data-testid="slide-number-toggle"
			className={className}
		>
			{t("slideNumber.label", "Slide #")}
		</Button>
	);
}
