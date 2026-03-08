import type { CommunityEntry } from "../community-types";

/**
 * Normalizes a community row from the database into a canonical CommunityEntry.
 *
 * @param communityPublic - Raw community data from community_public
 * @returns Normalized CommunityEntry with defaults for timestamps
 */
export default function normalizeCommunityEntry(communityPublic: CommunityEntry): CommunityEntry {
	return {
		community_id: communityPublic.community_id,
		owner_id: communityPublic.owner_id,
		name: communityPublic.name,
		slug: communityPublic.slug,
		description: communityPublic.description,
		is_public: communityPublic.is_public,
		public_notes: communityPublic.public_notes,
		...(communityPublic.active_event_id === undefined
			? {}
			: { active_event_id: communityPublic.active_event_id }),
		created_at: communityPublic.created_at || new Date().toISOString(),
		updated_at: communityPublic.updated_at || new Date().toISOString(),
	};
}
