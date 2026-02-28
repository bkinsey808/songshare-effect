// useLocale provides `t` (from react-i18next) and `lang` together
import { Link } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import LibraryIcon from "@/react/lib/design-system/icons/LibraryIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { communityViewPath, eventViewPath } from "@/shared/paths";

import usePendingInvitationSection from "./usePendingInvitationSection";

/**
 * Renders a list of pending community and event invitations.
 *
 * Each invitation shows the name, type, and "Accept" / "Decline" buttons.
 * After acceptance, a link to visit the joined community/event is displayed.
 *
 * @param currentLang - language code for navigation links
 * @returns React element for the pending invitations section
 */
export default function PendingInvitationsSection(): ReactElement | undefined {
	const {
		pendingCommunityInvitations,
		pendingEventInvitations,
		invitationError,
		hasInvitations,
		handleAcceptCommunity,
		handleDeclineCommunity,
		handleAcceptEvent,
		handleDeclineEvent,
	} = usePendingInvitationSection();

	const { lang, t } = useLocale();

	if (!hasInvitations && invitationError === undefined) {
		return undefined;
	}

	return (
		<div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
			<h3 className="mb-4 text-lg font-semibold">
				{t("pages.dashboard.pendingInvitations", "Pending Invitations")}
			</h3>

			{invitationError !== undefined && invitationError !== "" && (
				<div className="mb-4 rounded bg-red-900/50 p-2 text-sm text-red-200 border border-red-700">
					{invitationError}
				</div>
			)}

			<div className="space-y-4">
				{/* Community Invitations */}
				{pendingCommunityInvitations.map((inv) => (
					<div
						key={inv.community_id}
						className="flex items-center justify-between gap-4 rounded bg-gray-700/50 p-3"
					>
						<div className="flex items-center gap-3">
							<LibraryIcon className="size-5 text-blue-400" />
							<div>
								<p className="font-medium text-white">{inv.community_name}</p>
								<p className="text-xs text-gray-400">
									{t("pages.dashboard.communityInvitation", "Community Invitation")}
								</p>
							</div>
						</div>

						{inv.accepted === true ? (
							<Link
								to={buildPathWithLang(`/${communityViewPath}/${inv.community_slug}`, lang)}
								className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
							>
								{t("pages.dashboard.visitCommunity", "Visit Community →")}
							</Link>
						) : (
							<div className="flex gap-2">
								<Button
									variant="primary"
									size="compact"
									onClick={() => {
										handleAcceptCommunity(inv.community_id);
									}}
								>
									{t("pages.dashboard.accept", "Accept")}
								</Button>
								<Button
									variant="outlineDanger"
									size="compact"
									onClick={() => {
										handleDeclineCommunity(inv.community_id);
									}}
								>
									{t("pages.dashboard.decline", "Decline")}
								</Button>
							</div>
						)}
					</div>
				))}

				{/* Event Invitations */}
				{pendingEventInvitations.map((inv) => (
					<div
						key={inv.event_id}
						className="flex items-center justify-between gap-4 rounded bg-gray-700/50 p-3"
					>
						<div className="flex items-center gap-3">
							<div className="size-5 rounded flex items-center justify-center bg-purple-500/20 text-purple-400">
								📅
							</div>
							<div>
								<p className="font-medium text-white">{inv.event_name}</p>
								<p className="text-xs text-gray-400">
									{t("pages.dashboard.eventInvitation", "Event Invitation")}
								</p>
							</div>
						</div>

						{inv.accepted === true ? (
							<Link
								to={buildPathWithLang(`/${eventViewPath}/${inv.event_slug}`, lang)}
								className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
							>
								{t("pages.dashboard.visitEvent", "Visit Event →")}
							</Link>
						) : (
							<div className="flex gap-2">
								<Button
									variant="primary"
									size="compact"
									onClick={() => {
										handleAcceptEvent(inv.event_id);
									}}
								>
									{t("pages.dashboard.accept", "Accept")}
								</Button>
								<Button
									variant="outlineDanger"
									size="compact"
									onClick={() => {
										handleDeclineEvent(inv.event_id);
									}}
								>
									{t("pages.dashboard.decline", "Decline")}
								</Button>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
