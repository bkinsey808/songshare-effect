import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SIGNAL_ONE } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import normalizeStoredChordBody from "@/shared/music/chord-display/normalizeStoredChordBody";
import { dashboardPath } from "@/shared/paths";
import { justUnauthorizedAccessKey } from "@/shared/sessionStorageKeys";
import { isSongKey } from "@/shared/song/songKeyOptions";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import { safeGet } from "@/shared/utils/safe";

import computeSlideOrder from "../slides-editor/computeSlideOrder";
import computeSlides from "../slides-editor/computeSlides";
import type { Slide, SongFormValues } from "../song-form-types";
import setFieldValue from "./setFieldValue";

const DOM_READY_TIMEOUT_MS = 100;
const FALLBACK_TIMEOUT_MS = 5000;

type UsePopulateSongFormParams = {
	readonly songId: string | undefined;
	readonly publicSongs: Record<string, unknown>;
	readonly privateSongs: Record<string, unknown>;
	readonly currentUserId: string | undefined;
	readonly isFetching: boolean;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly songNameRef: React.RefObject<HTMLInputElement | null>;
	readonly songSlugRef: React.RefObject<HTMLInputElement | null>;
	readonly setIsLoadingData: (loading: boolean) => void;
	readonly setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	readonly setSlideOrder: (order: readonly string[]) => void;
	readonly setSlides: (slides: Readonly<Record<string, Slide>>) => void;
	readonly initialSlideId: string;
};

/**
 * Hook that populates the form when song data becomes available.
 * Handles ownership checks, form value population (including `lyrics` and
 * `script` language codes), and slide updates.
 *
 * @param songId - Optional song id being edited
 * @param publicSongs - Map of public song payloads used to populate public fields
 * @param privateSongs - Map of private song payloads used to populate private fields
 * @param currentUserId - Current authenticated user id for ownership checks
 * @param isFetching - True while the fetch request is in progress
 * @param hasPopulatedRef - Ref used to avoid re-populating the form multiple times
 * @param formRef - Ref to the HTML form element for DOM value syncing
 * @param songNameRef - Ref to the song name input element
 * @param songSlugRef - Ref to the song slug input element
 * @param setIsLoadingData - Setter to toggle loading spinner state
 * @param setFormValuesState - Setter for controlled form values state
 * @param setSlideOrder - Setter to update slide order array
 * @param setSlides - Setter to replace the slides map
 * @param initialSlideId - Initial slide id used as fallback when no slides present
 * @returns void
 */
export default function usePopulateSongForm({
	songId,
	publicSongs,
	privateSongs,
	currentUserId,
	isFetching,
	hasPopulatedRef,
	formRef,
	songNameRef,
	songSlugRef,
	setIsLoadingData,
	setFormValuesState,
	setSlideOrder,
	setSlides,
	initialSlideId,
}: UsePopulateSongFormParams): void {
	const navigate = useNavigate();

	// Populate form state when song data becomes available and verify ownership
	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			setIsLoadingData(false);
			return;
		}

		if (isFetching) {
			return;
		}

		const songPublic = safeGet(publicSongs, songId);
		const songPrivate = safeGet(privateSongs, songId);

		if (songPrivate === undefined) {
			const fallbackTimeout = setTimeout((): void => {
				setIsLoadingData(false);
			}, FALLBACK_TIMEOUT_MS);
			return (): void => {
				clearTimeout(fallbackTimeout);
			};
		}

		// CRITICAL: Check ownership before allowing edit access
		if (isRecord(songPublic) && currentUserId !== undefined) {
			const songUserId = songPublic["user_id"];
			if (isString(songUserId) && songUserId !== currentUserId) {
				try {
					sessionStorage.setItem(justUnauthorizedAccessKey, SIGNAL_ONE);
				} catch {
					// ignore storage errors
				}
				const PATH_SEGMENT_INDEX = 1;
				const currentLang =
					typeof globalThis === "undefined"
						? defaultLanguage
						: (new URL(globalThis.location.href).pathname.split("/")[PATH_SEGMENT_INDEX] ??
							defaultLanguage);
				const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
				void navigate(buildPathWithLang(`/${dashboardPath}`, langForNav), { replace: true });
				return;
			}
		}

		if (hasPopulatedRef.current) {
			setIsLoadingData(false);
			return;
		}

		hasPopulatedRef.current = true;

		// Update controlled form values from song data, including language fields
		if (isRecord(songPublic)) {
			const rawLyrics = songPublic["lyrics"];
			const lyrics: readonly string[] = (() => {
				if (Array.isArray(rawLyrics)) {
					return (rawLyrics as unknown[]).filter((value) => isString(value));
				}
				if (isString(rawLyrics)) {
					return [rawLyrics];
				}
				return [defaultLanguage];
			})();

			const rawScript = songPublic["script"];
			const script: readonly string[] = (() => {
				if (Array.isArray(rawScript)) {
					return (rawScript as unknown[]).filter((value) => isString(value));
				}
				if (isString(rawScript)) {
					return [rawScript];
				}
				return [];
			})();

			const rawTranslations = songPublic["translations"];
			const translations: readonly string[] = Array.isArray(rawTranslations)
				? (rawTranslations as unknown[]).filter((value) => isString(value))
				: [];

			const rawChords = songPublic["chords"];
			const chords: readonly string[] = Array.isArray(rawChords)
				? (rawChords as unknown[])
						.filter((value) => isString(value))
						.flatMap((value) => {
							const normalizedChordBody = normalizeStoredChordBody(value);
							return normalizedChordBody === undefined ? [] : [normalizedChordBody];
						})
				: [];

			const newFormValues: SongFormValues = {
				song_name: isString(songPublic["song_name"]) ? songPublic["song_name"] : "",
				song_slug: isString(songPublic["song_slug"]) ? songPublic["song_slug"] : "",
				lyrics,
				script,
				translations,
				chords,
				key: isSongKey(songPublic["key"]) ? songPublic["key"] : "",
				short_credit: isString(songPublic["short_credit"]) ? songPublic["short_credit"] : "",
				long_credit: isString(songPublic["long_credit"]) ? songPublic["long_credit"] : "",
				public_notes: isString(songPublic["public_notes"]) ? songPublic["public_notes"] : "",
				private_notes:
					isRecord(songPrivate) &&
					"private_notes" in songPrivate &&
					isString(songPrivate["private_notes"])
						? songPrivate["private_notes"]
						: "",
			};
			setFormValuesState(newFormValues);
		} else if (isRecord(songPrivate) && "private_notes" in songPrivate) {
			const privateNotes = songPrivate["private_notes"];
			if (isString(privateNotes)) {
				setFormValuesState((prev) => ({
					...prev,
					private_notes: privateNotes,
				}));
			}
		}

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsLoadingData(false);
			});
		});

		const timeoutId = setTimeout(() => {
			if (isRecord(songPublic) && formRef.current) {
				if ("song_name" in songPublic) {
					const songName = songPublic["song_name"];
					if (isString(songName)) {
						setFieldValue(formRef.current, "song_name", songName);
						if (songNameRef.current) {
							songNameRef.current.value = songName;
						}
					}
				}

				if ("song_slug" in songPublic) {
					const songSlug = songPublic["song_slug"];
					if (isString(songSlug)) {
						setFieldValue(formRef.current, "song_slug", songSlug);
						if (songSlugRef.current) {
							songSlugRef.current.value = songSlug;
						}
					}
				}

				if ("short_credit" in songPublic) {
					const shortCredit = songPublic["short_credit"];
					setFieldValue(
						formRef.current,
						"short_credit",
						isString(shortCredit) ? shortCredit : undefined,
					);
				}
				if ("key" in songPublic) {
					const songKey = songPublic["key"];
					setFieldValue(formRef.current, "key", isSongKey(songKey) ? songKey : undefined);
				}
				if ("long_credit" in songPublic) {
					const longCredit = songPublic["long_credit"];
					setFieldValue(
						formRef.current,
						"long_credit",
						isString(longCredit) ? longCredit : undefined,
					);
				}
				if ("public_notes" in songPublic) {
					const publicNotes = songPublic["public_notes"];
					setFieldValue(
						formRef.current,
						"public_notes",
						isString(publicNotes) ? publicNotes : undefined,
					);
				}
			}

			if (isRecord(songPrivate) && "private_notes" in songPrivate && formRef.current) {
				const privateNotes = songPrivate["private_notes"];
				if (isString(privateNotes)) {
					const element = formRef.current.elements.namedItem("private_notes");
					if (element instanceof HTMLTextAreaElement) {
						element.value = privateNotes;
					}
				}
			}
		}, DOM_READY_TIMEOUT_MS);

		// Populate slides from songPublic
		if (isRecord(songPublic)) {
			setSlideOrder(computeSlideOrder(songPublic));
			setSlides(computeSlides(songPublic));
		}

		/**
		 * Cleanup side-effects scheduled by this effect (timeouts).
		 *
		 * @returns void
		 */
		function cleanup(): void {
			clearTimeout(timeoutId);
		}
		return cleanup;
	}, [
		songId,
		publicSongs,
		privateSongs,
		setSlideOrder,
		setSlides,
		currentUserId,
		navigate,
		setIsLoadingData,
		initialSlideId,
		isFetching,
		hasPopulatedRef,
		formRef,
		songNameRef,
		songSlugRef,
		setFormValuesState,
	]);
}
