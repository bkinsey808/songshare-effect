import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SIGNAL_ONE } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath } from "@/shared/paths";
import { justUnauthorizedAccessKey } from "@/shared/sessionStorageKeys";
import { safeGet } from "@/shared/utils/safe";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import type { Slide, SongFormValues } from "../song-form-types";

import setFieldValue from "./setFieldValue";
import computeSlideOrder from "../slides-editor/computeSlideOrder";
import computeSlides from "../slides-editor/computeSlides";
import computeFieldsArray from "./computeFieldsArray";

const DOM_READY_TIMEOUT_MS = 100;
const FALLBACK_TIMEOUT_MS = 5000;

type UsePopulateSongFormParams = {
	readonly songId: string | undefined;
	readonly publicSongs: Record<string, unknown>;
	readonly privateSongs: Record<string, unknown>;
	readonly currentUserId: string | undefined;
	readonly isFetchingRef: React.RefObject<boolean>;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly songNameRef: React.RefObject<HTMLInputElement | null>;
	readonly songSlugRef: React.RefObject<HTMLInputElement | null>;
	readonly fields: readonly string[];
	readonly setIsLoadingData: (loading: boolean) => void;
	readonly setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	readonly setSlideOrder: (order: readonly string[]) => void;
	readonly setSlides: (slides: Readonly<Record<string, Slide>>) => void;
	readonly toggleField: (field: string, checked: boolean) => void;
	readonly initialSlideId: string;
};

/**
 * Hook that populates the form when song data becomes available.
 * Handles ownership checks, form value population, and slide/field updates.
 */
export default function usePopulateSongForm({
	songId,
	publicSongs,
	privateSongs,
	currentUserId,
	isFetchingRef,
	hasPopulatedRef,
	formRef,
	songNameRef,
	songSlugRef,
	fields,
	setIsLoadingData,
	setFormValuesState,
	setSlideOrder,
	setSlides,
	toggleField,
	initialSlideId,
}: UsePopulateSongFormParams): void {
	const navigate = useNavigate();

	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			// If not editing, ensure loading is false
			setIsLoadingData(false);
			return;
		}

		// Only populate if fetch has completed (or if we're not currently fetching)
		// This ensures we only use fresh data from the completed fetch
		if (isFetchingRef.current) {
			// Still fetching - wait for it to complete
			// The effect will re-run when the store updates after fetch completes
			return;
		}

		// Note: We don't check formRef.current here because the form might not be rendered yet
		// (it's hidden behind the spinner). We'll check it only when needed for DOM updates.

		const songPublic = safeGet(publicSongs, songId);
		const songPrivate = safeGet(privateSongs, songId);

		// Only require private song to be loaded (it's needed for private_notes)
		// Public song may fail to decode, but we can still populate what we can
		if (songPrivate === undefined) {
			// Data not ready yet, keep loading state true and wait
			// The effect will re-run when privateSongs updates
			// Set a fallback timeout to prevent spinner from being stuck forever
			const fallbackTimeout = setTimeout((): void => {
				setIsLoadingData(false);
			}, FALLBACK_TIMEOUT_MS);
			return (): void => {
				clearTimeout(fallbackTimeout);
			};
		}

		// CRITICAL: Check ownership before allowing edit access
		// If the song's user_id doesn't match the current user, redirect to dashboard
		if (isRecord(songPublic) && currentUserId !== undefined) {
			const songUserId = songPublic["user_id"];
			if (isString(songUserId) && songUserId !== currentUserId) {
				// User doesn't own this song - redirect to dashboard with alert
				try {
					sessionStorage.setItem(justUnauthorizedAccessKey, SIGNAL_ONE);
				} catch {
					// ignore storage errors
				}
				// Get current language from pathname for navigation
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

		// If we've already populated, we're done (subsequent updates handled by realtime subscriptions)
		if (hasPopulatedRef.current) {
			setIsLoadingData(false);
			return;
		}

		// First time populating after fetch - this is guaranteed to be fresh data
		// because fetchInitiatedRef was set BEFORE the fetch, so any data arriving
		// now must be from the fresh fetch
		hasPopulatedRef.current = true;

		// Update controlled form values immediately when data is available
		// Public song has song_name, song_slug, etc. Private song only has private_notes
		if (isRecord(songPublic)) {
			// Update form values state from public song data
			const newFormValues = {
				song_name: isString(songPublic["song_name"]) ? songPublic["song_name"] : "",
				song_slug: isString(songPublic["song_slug"]) ? songPublic["song_slug"] : "",
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
			// If no public song, at least set private notes if available
			const privateNotes = songPrivate["private_notes"];
			if (isString(privateNotes)) {
				setFormValuesState((prev) => ({
					...prev,
					private_notes: privateNotes,
				}));
			}
		}

		// Use requestAnimationFrame to ensure form is fully updated before showing
		// This prevents flash of partially populated form
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsLoadingData(false);
			});
		});

		// Also update DOM elements for form submission compatibility
		const timeoutId = setTimeout(() => {
			// Only public song has song_name, song_slug, etc.
			if (isRecord(songPublic) && formRef.current) {
				// Access song_name safely
				if ("song_name" in songPublic) {
					const songName = songPublic["song_name"];
					if (isString(songName)) {
						setFieldValue(formRef.current, "song_name", songName);
						if (songNameRef.current) {
							songNameRef.current.value = songName;
						}
					}
				}

				// Access song_slug safely
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

			// Populate private_notes from songPrivate
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

		// Populate slides and fields from songPublic (only public song has this data)
		if (isRecord(songPublic)) {
			// Compute and apply fields
			const fieldsArray = computeFieldsArray(songPublic);
			const allPossibleFields = ["lyrics", "script", "enTranslation"];
			for (const field of allPossibleFields) {
				if (typeof field === "string") {
					const shouldBeEnabled = fieldsArray.includes(field);
					const isCurrentlyEnabled = fields.includes(field);
					if (shouldBeEnabled !== isCurrentlyEnabled) {
						toggleField(field, shouldBeEnabled);
					}
				}
			}

			// Slide order
			setSlideOrder(computeSlideOrder(songPublic));

			// Slides
			setSlides(computeSlides(songPublic));
		}

		// Note: isLoadingData is already set to false above after populating form values
		// This ensures the form only shows after all data (including slides) is populated

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
		toggleField,
		fields,
		currentUserId,
		navigate,
		setIsLoadingData,
		initialSlideId,
		isFetchingRef,
		hasPopulatedRef,
		formRef,
		songNameRef,
		songSlugRef,
		setFormValuesState,
	]);
}
