import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import Button from "@/react/lib/design-system/Button";
import ExitFullScreenIcon from "@/react/lib/design-system/icons/ExitFullScreenIcon";
import FullScreenIcon from "@/react/lib/design-system/icons/FullScreenIcon";
import WakeLockOffIcon from "@/react/lib/design-system/icons/WakeLockOffIcon";
import WakeLockOnIcon from "@/react/lib/design-system/icons/WakeLockOnIcon";
import useFullScreen from "@/react/lib/fullscreen/useFullScreen";
import useLocale from "@/react/lib/language/locale/useLocale";
import useWakeLock from "@/react/lib/wake-lock/useWakeLock";
import SlideNumberToggle from "@/react/slide-number/SlideNumberToggle";
import SlideOrientationToggle from "@/react/slide-orientation/SlideOrientationToggle";

/**
 * Card containing chord and slide display preferences, plus full screen and wake lock controls.
 *
 * @returns The display settings card.
 */
export default function DisplaySettingsCard(): ReactElement {
	const { t } = useLocale();
	const { isFullScreen, toggleFullScreen } = useFullScreen();
	const { isWakeLockActive, toggleWakeLock, isSupported: isWakeLockSupported } = useWakeLock();

	const actionButtonClassName =
		"rounded-md! whitespace-nowrap text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5";

	return (
		<div className="rounded-lg bg-slate-800/50 px-3 py-2">
			<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
				{t("navigation.displaySettings", "Display")}
			</div>
			<div className="flex flex-wrap items-center gap-3 sm:gap-5">
				<ChordDisplayModeSelect />
				<SlideOrientationToggle showLabel />
				<SlideNumberToggle />
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
			</div>
		</div>
	);
}
