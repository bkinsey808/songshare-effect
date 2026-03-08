import { Effect } from "effect";

import type { CommunityEntry } from "@/react/community/community-types";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";
import {
	apiCommunityShareRequestCreatePath,
	communityEditPath,
	communityManagePath,
	communityViewPath,
	dashboardPath,
} from "@/shared/paths";

type StateSetter<Value> = (value: Value | ((current: Value) => Value)) => void;

type CreateCommunityViewHandlersParams = {
	lang: SupportedLanguageType;
	navigate: (path: string) => void | Promise<void>;
	communitySlug: string | undefined;
	communityId: string | undefined;
	currentCommunity: CommunityEntry | undefined;
	fetchCommunityBySlug: (
		slug: string,
		options?: { silent?: boolean },
	) => Effect.Effect<unknown, Error>;
	joinCommunity: (
		communityId: string,
		options?: { silent?: boolean },
	) => Effect.Effect<unknown, Error>;
	leaveCommunity: (
		communityId: string,
		options?: { silent?: boolean },
	) => Effect.Effect<unknown, Error>;
	setIsJoinLoading: StateSetter<boolean>;
	setIsLeaveLoading: StateSetter<boolean>;
};

type CommunityViewHandlers = {
	onJoinClick: () => void;
	onLeaveClick: () => void;
	onManageClick: () => void;
	onEditClick: () => void;
	onShareSongClick: (songId: string) => void;
	onSharePlaylistClick: (playlistId: string) => void;
	/** Refreshes community data (members, etc.). Call after sharing community to update Pending Invitations. */
	onRefreshCommunity: () => void;
};

async function refreshCommunity(
	communitySlug: string | undefined,
	fetchCommunityBySlug: CreateCommunityViewHandlersParams["fetchCommunityBySlug"],
): Promise<void> {
	if (communitySlug !== undefined && communitySlug !== "") {
		try {
			await Effect.runPromise(fetchCommunityBySlug(communitySlug, { silent: true }));
		} catch {
			// Error handled by store
		}
	}
}

/**
 * Builds action callbacks for the public community view screen.
 *
 * @param params - current hook state and dependencies
 * @returns view callbacks consumed by `useCommunityView`
 */
export default function createCommunityViewHandlers(
	params: CreateCommunityViewHandlersParams,
): CommunityViewHandlers {
	const {
		lang,
		navigate,
		communitySlug,
		communityId,
		currentCommunity,
		fetchCommunityBySlug,
		joinCommunity,
		leaveCommunity,
		setIsJoinLoading,
		setIsLeaveLoading,
	} = params;

	function onJoinClick(): void {
		if (currentCommunity === undefined) {
			return;
		}
		void (async (): Promise<void> => {
			setIsJoinLoading(true);
			let joined = false;
			try {
				await Effect.runPromise(joinCommunity(currentCommunity.community_id, { silent: true }));
				joined = true;
			} catch {
				// Error handled by store
			}
			if (joined) {
				await refreshCommunity(communitySlug, fetchCommunityBySlug);
			}
			setIsJoinLoading(false);
		})();
	}

	function onLeaveClick(): void {
		if (currentCommunity === undefined) {
			return;
		}
		void (async (): Promise<void> => {
			setIsLeaveLoading(true);
			let left = false;
			try {
				await Effect.runPromise(leaveCommunity(currentCommunity.community_id, { silent: true }));
				left = true;
			} catch {
				// Error handled by store
			}
			if (left) {
				await refreshCommunity(communitySlug, fetchCommunityBySlug);
			}
			setIsLeaveLoading(false);
		})();
	}

	function onManageClick(): void {
		if (communitySlug !== undefined && communitySlug !== "") {
			const managePath = buildPathWithLang(
				`/${communityViewPath}/${communitySlug}/${communityManagePath}`,
				lang,
			);
			void navigate(managePath);
		}
	}

	function onEditClick(): void {
		if (currentCommunity !== undefined) {
			const editPath = buildPathWithLang(
				`/${dashboardPath}/${communityEditPath}/${currentCommunity.community_id}`,
				lang,
			);
			void navigate(editPath);
		}
	}

	function onShareSongClick(songId: string): void {
		if (communityId === undefined) {
			return;
		}
		void (async (): Promise<void> => {
			let submitted = false;
			try {
				await postJson(apiCommunityShareRequestCreatePath, {
					community_id: communityId,
					shared_item_type: "song",
					shared_item_id: songId,
				});
				submitted = true;
			} catch {
				// Server-side errors are surfaced through the existing community fetch state on refresh.
			}
			if (submitted) {
				await refreshCommunity(communitySlug, fetchCommunityBySlug);
			}
		})();
	}

	function onSharePlaylistClick(playlistId: string): void {
		if (communityId === undefined) {
			return;
		}
		void (async (): Promise<void> => {
			let submitted = false;
			try {
				await postJson(apiCommunityShareRequestCreatePath, {
					community_id: communityId,
					shared_item_type: "playlist",
					shared_item_id: playlistId,
				});
				submitted = true;
			} catch {
				// Server-side errors are surfaced through the existing community fetch state on refresh.
			}
			if (submitted) {
				await refreshCommunity(communitySlug, fetchCommunityBySlug);
			}
		})();
	}

	function onRefreshCommunity(): void {
		void refreshCommunity(communitySlug, fetchCommunityBySlug);
	}

	return {
		onJoinClick,
		onLeaveClick,
		onManageClick,
		onEditClick,
		onShareSongClick,
		onSharePlaylistClick,
		onRefreshCommunity,
	};
}
