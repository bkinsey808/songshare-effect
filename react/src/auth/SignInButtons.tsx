import useIsOnline from "@/react/hooks/useIsOnline";
import useLocale from "@/react/language/locale/useLocale";
import getFrontEndProviderData from "@/react/providers/providers";
import computeRedirectPort from "@/react/utils/computeRedirectPort";
import cssVars from "@/react/utils/cssVars";
import toTitleCase from "@/react/utils/toTitleCase";
import { apiOauthSignInPath } from "@/shared/paths";
import { activeProviders } from "@/shared/providers";
import { langQueryParam, redirectPortQueryParam } from "@/shared/queryParams";

export default function SignInButtons(): ReactElement {
	const isOnline = useIsOnline();
	const { lang, t } = useLocale();
	const isSignedIn = false;

	// use helper to compute redirect port (keeps SSR safe and easier to test)
	const redirectPort = computeRedirectPort();

	return (
		<div className="flex flex-col items-center justify-center gap-6">
			{!isSignedIn && (
				<div className="mb-4 text-lg text-gray-400">
					<p>{t("auth.signedOutMessage", "You are not signed in.")}</p>
					<p>{t("auth.signInPrompt", "Please sign in to access your dashboard and features.")}</p>
				</div>
			)}
			{isOnline &&
				activeProviders.map((provider) => {
					const { Icon, brandColor, hoverColor, iconBgColor, textColor, borderColor } =
						getFrontEndProviderData(provider);

					// build href and include redirect_port only when present
					const signInBase = `${apiOauthSignInPath}/${provider}?${langQueryParam}=${lang}`;
					const signInHref = redirectPort
						? `${signInBase}&${redirectPortQueryParam}=${redirectPort}`
						: signInBase;

					return (
						<div key={provider}>
							<a
								style={cssVars({
									brandColor,
									hoverColor,
									iconBgColor,
									textColor,
									borderColor,
								})}
								href={signInHref}
								className="flex items-center gap-2 rounded border border-(--border-color) bg-(--brand-color) px-6 py-3 text-(--text-color) shadow transition hover:bg-(--hover-color)"
							>
								<span className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-(--icon-bg-color) p-1">
									<Icon />
								</span>
								{t("auth.signInWithProvider", {
									provider: toTitleCase(provider),
								})}
							</a>
						</div>
					);
				})}
		</div>
	);
}
