import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import Button from "@/react/lib/design-system/Button";
import useLocale from "@/react/lib/language/locale/useLocale";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";

import useSetSlideNumberPreference from "./useSetSlideNumberPreference";
import useSlideNumberPreference from "./useSlideNumberPreference";

type SlideNumberToggleProps = Readonly<{
	className?: string;
}>;

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
