import Button from "@/react/lib/design-system/Button";
import ExitFullScreenIcon from "@/react/lib/design-system/icons/ExitFullScreenIcon";
import FullScreenIcon from "@/react/lib/design-system/icons/FullScreenIcon";
import WakeLockOffIcon from "@/react/lib/design-system/icons/WakeLockOffIcon";
import WakeLockOnIcon from "@/react/lib/design-system/icons/WakeLockOnIcon";
import useFullScreen from "@/react/lib/fullscreen/useFullScreen";
import useLocale from "@/react/lib/language/locale/useLocale";
import LanguageSwitcher from "@/react/lib/language/switcher/LanguageSwitcher";
import useWakeLock from "@/react/lib/wake-lock/useWakeLock";

/**
 * Card containing settings controls.
 * @returns The settings card with Full Screen, Wake Lock, and Language controls.
 */
export default function SettingsCard(): ReactElement {
	const { t } = useLocale();
	const { isFullScreen, toggleFullScreen } = useFullScreen();
	const { isWakeLockActive, toggleWakeLock, isSupported: isWakeLockSupported } = useWakeLock();

	return (
		<div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
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
		</div>
	);
}
