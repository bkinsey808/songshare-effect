import { useTranslation } from "react-i18next";

import { setSigninPending } from "@/react/auth/signinPending";
import { useIsOnline } from "@/react/hooks/useIsOnline";
import { useLanguage } from "@/react/language/useLanguage";
import { getFrontEndProviderData } from "@/react/providers/providers";
import { cssVars } from "@/react/utils/cssVars";
import { toTitleCase } from "@/react/utils/stringUtils";
import { apiOauthSignInPath } from "@/shared/paths";
import { activeProviders } from "@/shared/providers";
import { langQueryParam, redirectPortQueryParam } from "@/shared/queryParams";

export const SignInButtons = (): ReactElement => {
	const isOnline = useIsOnline();
	const { t } = useTranslation();
	const isSignedIn = false;
	const lang = useLanguage();

	// compute redirectPort: only include when useful (dev/localhost or explicit non-default port)
	const redirectPort = (() => {
		if (typeof window === "undefined") {
			// SSR: omit port
			return "";
		}
		const port = String(window.location.port || "");
		const hostname = window.location.hostname || "";

		// Only include redirect_port for local/dev hosts, or when an explicit port is set.
		if (
			// explicit port
			port !== "" ||
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname.endsWith(".local")
		) {
			// fall back to dev default for localhost when port missing
			return port || "5173";
		}

		// production / no explicit port -> omit param
		return "";
	})();

	return (
		<div className="flex flex-col items-center justify-center gap-6">
			{isSignedIn === false && (
				<div className="mb-4 text-lg text-gray-700">
					<p>{t("auth.signedOutMessage", "You are not signed in.")}</p>
					<p>
						{t(
							"auth.signInPrompt",
							"Please sign in to access your dashboard and features.",
						)}
					</p>
				</div>
			)}
			{isOnline &&
				activeProviders.map((provider) => {
					const {
						Icon,
						brandColor,
						hoverColor,
						iconBgColor,
						textColor,
						borderColor,
					} = getFrontEndProviderData(provider);

					// build href and include redirect_port only when present
					const signInBase = `${apiOauthSignInPath}/${provider}?${langQueryParam}=${lang}`;
					const signInHref = redirectPort
						? `${signInBase}&${redirectPortQueryParam}=${redirectPort}`
						: signInBase;

					return (
						<div key={provider}>
							<a
								// Mark that a sign-in flow has started so the app can hide the
								// homepage immediately and avoid a flash when the OAuth redirect
								// returns to the app. Use sessionStorage so the flag survives the
								// full-page navigation to the provider and back.
								onClick={() => setSigninPending()}
								style={cssVars({
									brandColor,
									hoverColor,
									iconBgColor,
									textColor,
									borderColor,
								})}
								href={signInHref}
								className="flex items-center gap-2 rounded border border-[var(--border-color)] bg-[var(--brand-color)] px-6 py-3 text-[var(--text-color)] shadow transition hover:bg-[var(--hover-color)]"
							>
								<span className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-[var(--icon-bg-color)] p-1">
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
};
