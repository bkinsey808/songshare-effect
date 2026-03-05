import { useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import ExitFullScreenIcon from "@/react/lib/design-system/icons/ExitFullScreenIcon";
import FullScreenIcon from "@/react/lib/design-system/icons/FullScreenIcon";
import LogOutIcon from "@/react/lib/design-system/icons/LogOutIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import WakeLockOffIcon from "@/react/lib/design-system/icons/WakeLockOffIcon";
import WakeLockOnIcon from "@/react/lib/design-system/icons/WakeLockOnIcon";
import useFullScreen from "@/react/lib/fullscreen/useFullScreen";
import useLocale from "@/react/lib/language/locale/useLocale";
import LanguageSwitcher from "@/react/lib/language/switcher/LanguageSwitcher";
import useWakeLock from "@/react/lib/wake-lock/useWakeLock";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, deleteAccountPath } from "@/shared/paths";

import useDashboard from "@/react/pages/dashboard/useDashboard";

/**
 * Card containing settings and account controls.
 * @returns The settings card with Full Screen, Wake Lock, Language, Sign Out, and Delete Account.
 */
export default function SettingsCard(): ReactElement {
	const { t } = useLocale();
	const navigate = useNavigate();
	const { isFullScreen, toggleFullScreen } = useFullScreen();
	const { isWakeLockActive, toggleWakeLock, isSupported: isWakeLockSupported } = useWakeLock();
	const { signOut, currentLang, localIsSignedIn } = useDashboard();

	return (
		<div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
			{/* Full Screen toggle */}
			<Button
				size="compact"
				variant={isFullScreen ? "primary" : "outlineSecondary"}
				icon={
					isFullScreen ? (
						<ExitFullScreenIcon className="size-4" />
					) : (
						<FullScreenIcon className="size-4" />
					)
				}
				onClick={toggleFullScreen}
				data-testid="navigation-fullscreen-toggle"
				className="rounded-md! whitespace-nowrap"
			>
				{isFullScreen
					? t("navigation.exitFullScreen", "Exit Full Screen")
					: t("navigation.fullScreen", "Full Screen")}
			</Button>
			{/* Wake Lock toggle - prevents screen from sleeping */}
			{isWakeLockSupported && (
				<Button
					size="compact"
					variant={isWakeLockActive ? "primary" : "outlineSecondary"}
					icon={
						isWakeLockActive ? (
							<WakeLockOnIcon className="size-4" />
						) : (
							<WakeLockOffIcon className="size-4" />
						)
					}
					onClick={toggleWakeLock}
					data-testid="navigation-wakelock-toggle"
					className="rounded-md! whitespace-nowrap"
				>
					{t("navigation.wakeLock", "Wake Lock")}
				</Button>
			)}
			{/* Language selector */}
			<LanguageSwitcher />
			{/* Sign Out and Delete Account - only when signed in */}
			{localIsSignedIn === true && (
				<>
					<Button
						size="compact"
						variant="danger"
						icon={<LogOutIcon className="size-4" />}
						onClick={() => {
							void signOut();
						}}
						data-testid="navigation-sign-out"
						className="rounded-md! whitespace-nowrap"
					>
						{t("pages.dashboard.signOut", "Sign Out")}
					</Button>
					<Button
						size="compact"
						variant="outlineDanger"
						icon={<TrashIcon className="size-4" />}
						onClick={() => {
							const langForNav = isSupportedLanguage(currentLang)
								? currentLang
								: defaultLanguage;
							void navigate(buildPathWithLang(`/${dashboardPath}/${deleteAccountPath}`, langForNav));
						}}
						data-testid="navigation-delete-account"
						className="rounded-md! whitespace-nowrap"
					>
						{t("pages.dashboard.deleteAccount", "Delete Account")}
					</Button>
				</>
			)}
		</div>
	);
}
