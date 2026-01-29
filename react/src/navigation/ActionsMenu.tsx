import PlaylistCard from "./PlaylistCard";
import SettingsCard from "./SettingsCard";
import SongActionsCard from "./SongActionsCard";

type ActionsMenuProps = {
	readonly isVisible: boolean;
	readonly isScrolled: boolean;
};

/**
 * Expandable menu containing song actions, playlist actions, and settings controls.
 * @param props - Component props.
 * @param props.isVisible - Whether the menu is visible.
 * @param props.isScrolled - Whether the page has been scrolled.
 * @returns The actions menu component.
 */
export default function ActionsMenu({ isVisible, isScrolled }: ActionsMenuProps): ReactElement {
	return (
		<div
			className={`grid transition-all duration-200 ${
				isVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
			}`}
			aria-hidden={!isVisible}
		>
			<div className="overflow-hidden">
				<div
					className={`bg-slate-950 text-white transition-opacity duration-200 ${
						isVisible ? "opacity-100" : "opacity-0"
					}`}
				>
					<div
						className={`mx-auto max-w-screen-2xl transition-all duration-300 ${
							isScrolled ? "px-4 py-0.5" : "px-5 py-1"
						}`}
					>
						<div className="flex flex-wrap items-center justify-between gap-4">
							<SongActionsCard />
							<PlaylistCard />
							<SettingsCard />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
