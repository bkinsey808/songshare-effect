import { useNavigate } from "react-router-dom";

import useFullScreen from "@/react/lib/fullscreen/useFullScreen";
import useWakeLock from "@/react/lib/wake-lock/useWakeLock";
import useDashboard from "@/react/pages/dashboard/useDashboard";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, deleteAccountPath } from "@/shared/paths";

type UseSettingsCardReturn = {
	readonly handleDeleteAccountNavigation: () => void;
	readonly isFullScreen: boolean;
	readonly isWakeLockActive: boolean;
	readonly isWakeLockSupported: boolean;
	readonly localIsSignedIn: boolean | undefined;
	readonly signOut: () => Promise<void>;
	readonly toggleFullScreen: () => void;
	readonly toggleWakeLock: () => void;
};

export default function useSettingsCard(): UseSettingsCardReturn {
	const navigate = useNavigate();
	const { isFullScreen, toggleFullScreen } = useFullScreen();
	const { isWakeLockActive, toggleWakeLock, isSupported: isWakeLockSupported } = useWakeLock();
	const { signOut, currentLang, localIsSignedIn } = useDashboard();

	function handleDeleteAccountNavigation(): void {
		const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
		void navigate(buildPathWithLang(`/${dashboardPath}/${deleteAccountPath}`, langForNav));
	}

	return {
		handleDeleteAccountNavigation,
		isFullScreen,
		isWakeLockActive,
		isWakeLockSupported,
		localIsSignedIn,
		signOut,
		toggleFullScreen,
		toggleWakeLock,
	};
}
