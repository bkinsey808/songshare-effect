import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import fetchUsername from "@/react/supabase/enrichment/fetchUsername";
import { safeGet } from "@/shared/utils/safe";

type PlaylistSongCardProps = {
	songId: string;
	index: number;
	totalSongs: number;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	onRemove: (songId: string) => void;
	dragHandle?: React.ReactNode;
};

const INDEX_OFFSET = 1;
const INDEX_FIRST = 0;
const INDEX_LAST_OFFSET = 1;

/**
 * Card showing a single song entry within the playlist editor.
 * Includes controls to move or remove the song and displays owner info.
 *
 * @param props - PlaylistSongCardProps
 * @returns A React element rendering the song card
 */
export default function PlaylistSongCard({
	songId,
	index,
	totalSongs,
	onMoveUp,
	onMoveDown,
	onRemove,
	dragHandle,
}: PlaylistSongCardProps): React.JSX.Element {
	const { t } = useTranslation();
	const publicSongs = useAppStore((state) => state.publicSongs);
	const song = safeGet(publicSongs, songId);

	const [ownerUsername, setOwnerUsername] = useState<string | undefined>(undefined);

	// Fetch owner username if we have the song data but not the username yet
	useEffect(() => {
		async function fetchOwner(): Promise<void> {
			const client = getSupabaseClient();
			const userId = song?.user_id;

			if (client === undefined || userId === undefined || userId === "") {
				return;
			}

			const username = await fetchUsername({
				client,
				userId,
			});
			if (username !== undefined && username !== "") {
				setOwnerUsername(username);
			}
		}

		if (song?.user_id !== undefined && song.user_id !== "" && ownerUsername === undefined) {
			void fetchOwner();
		}
	}, [song?.user_id, ownerUsername]);

	let subText = "";
	if (ownerUsername !== undefined && ownerUsername !== "") {
		subText = `@${ownerUsername}`;
	} else if (song?.user_id !== undefined && song.user_id !== "") {
		subText = "...";
	}

	return (
		<div className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700 p-3">
			<div className="flex items-center gap-3">
				{dragHandle}
				<span className="w-6 text-center text-gray-400">{index + INDEX_OFFSET}</span>
				<div>
					<div className="font-medium text-white">{song?.song_name ?? songId}</div>
					<div className="text-xs text-gray-400">{subText}</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => {
						onMoveUp(index);
					}}
					disabled={index === INDEX_FIRST}
					className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-30"
					title={t("playlistEdit.moveUp", "Move up")}
				>
					<svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
					</svg>
				</button>
				<button
					type="button"
					onClick={() => {
						onMoveDown(index);
					}}
					disabled={index === totalSongs - INDEX_LAST_OFFSET}
					className="rounded p-1 text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-30"
					title={t("playlistEdit.moveDown", "Move down")}
				>
					<svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				<button
					type="button"
					onClick={() => {
						onRemove(songId);
					}}
					className="rounded p-1 text-red-400 hover:bg-red-900/30 hover:text-red-300"
					title={t("playlistEdit.remove", "Remove")}
				>
					<svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
