import Button from "@/react/lib/design-system/Button";
import ExitFullScreenIcon from "@/react/lib/design-system/icons/ExitFullScreenIcon";
import FullScreenIcon from "@/react/lib/design-system/icons/FullScreenIcon";
import LogOutIcon from "@/react/lib/design-system/icons/LogOutIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import WakeLockOffIcon from "@/react/lib/design-system/icons/WakeLockOffIcon";
import WakeLockOnIcon from "@/react/lib/design-system/icons/WakeLockOnIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import LanguageSwitcher from "@/react/lib/language/switcher/LanguageSwitcher";
import useSettingsCard from "@/react/navigation/settings-card/useSettingsCard";

/**
 * Card containing app and account controls.
 * @returns The settings card with Full Screen, Wake Lock, Language, Sign Out, and Delete Account.
 */
export default function SettingsCard(): ReactElement {
	const { t } = useLocale();
	const {
		handleDeleteAccountNavigation,
		isFullScreen,
		isWakeLockActive,
		isWakeLockSupported,
		localIsSignedIn,
		signOut,
		toggleFullScreen,
		toggleWakeLock,
	} = useSettingsCard();

	const actionButtonClassName =
		"rounded-md! whitespace-nowrap text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5";

	return (
		<div className="rounded-lg bg-slate-800/50 px-3 py-2">
			<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
				{t("navigation.settings", "Settings")}
			</div>
			<div className="flex flex-wrap items-center gap-3 sm:gap-5">
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
					className={actionButtonClassName}
				>
					{isFullScreen
						? t("navigation.exitFullScreen", "Exit Full Screen")
						: t("navigation.fullScreen", "Full Screen")}
				</Button>
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
						className={actionButtonClassName}
					>
						{t("navigation.wakeLock", "Wake Lock")}
					</Button>
				)}
				<LanguageSwitcher />
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
							className={actionButtonClassName}
						>
							{t("pages.dashboard.signOut", "Sign Out")}
						</Button>
						<Button
							size="compact"
							variant="outlineDanger"
							icon={<TrashIcon className="size-4" />}
							onClick={handleDeleteAccountNavigation}
							data-testid="navigation-delete-account"
							className={actionButtonClassName}
						>
							{t("pages.dashboard.deleteAccount", "Delete Account")}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
