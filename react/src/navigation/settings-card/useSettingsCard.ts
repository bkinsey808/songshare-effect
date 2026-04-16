import { useNavigate } from "react-router-dom";

import useDashboard from "@/react/pages/dashboard/useDashboard";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, deleteAccountPath } from "@/shared/paths";

type UseSettingsCardReturn = {
	readonly handleDeleteAccountNavigation: () => void;
	readonly localIsSignedIn: boolean | undefined;
	readonly signOut: () => Promise<void>;
};

/**
 * Hook for settings card behavior (sign out, delete account navigation).
 *
 * @returns Handlers and state for the settings card
 */
export default function useSettingsCard(): UseSettingsCardReturn {
	const navigate = useNavigate();
	const { signOut, currentLang, localIsSignedIn } = useDashboard();

	/**
	 * Navigate to the delete-account flow for the current language.
	 *
	 * @returns void
	 */
	function handleDeleteAccountNavigation(): void {
		const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
		void navigate(buildPathWithLang(`/${dashboardPath}/${deleteAccountPath}`, langForNav));
	}

	return {
		handleDeleteAccountNavigation,
		localIsSignedIn,
		signOut,
	};
}
