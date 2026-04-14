import SettingsCard from "./settings-card/SettingsCard";

type AccountMenuProps = {
	readonly isVisible: boolean;
	readonly isScrolled: boolean;
};

/**
 * Expandable account panel containing settings and account controls.
 * Opens when the signed-in username is clicked in the header.
 * @param isVisible - Whether the menu is visible.
 * @param isScrolled - Whether the page has been scrolled.
 * @returns The account menu component.
 */
export default function AccountMenu({ isVisible, isScrolled }: AccountMenuProps): ReactElement {
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
						<div className="flex flex-wrap items-start justify-end gap-4">
							<SettingsCard />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
