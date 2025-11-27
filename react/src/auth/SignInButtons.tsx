import { useTranslation } from "react-i18next";

import { useIsOnline } from "@/react/hooks/useIsOnline";
import { useLanguage } from "@/react/language/useLanguage";
import { getFrontEndProviderData } from "@/react/providers/providers";
import { cssVars } from "@/react/utils/cssVars";
import { toTitleCase } from "@/react/utils/stringUtils";
import { apiOauthSignInPath } from "@/shared/paths";
import { activeProviders } from "@/shared/providers";
import { langQueryParam, redirectPortQueryParam } from "@/shared/queryParams";

export function SignInButtons(): ReactElement {
	const isOnline = useIsOnline();
	const { t } = useTranslation();
	const isSignedIn = false;
	const lang = useLanguage();

	// compute redirectPort: only include when useful (dev/localhost or explicit non-default port)
	function computeRedirectPort(): string {
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
	}

	const redirectPort = computeRedirectPort();

	return (
		<div className="flex flex-col items-center justify-center gap-6">
			{!isSignedIn && (
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
