import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLoadCommunityById from "@/react/community/useLoadCommunityById";
import useAppForm from "@/react/lib/form/useAppForm";
import useFormChanges from "@/react/lib/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import useItemTags from "@/react/tag/useItemTags";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { communityViewPath } from "@/shared/paths";
import { communityFormSchema } from "@/shared/validation/communitySchemas";
import type { ValidationError } from "@/shared/validation/validate-types";

import type { CommunityFormValues } from "../community-types";

export type UseCommunityFormReturn = {
	tags: readonly string[];
	setTags: (tags: readonly string[]) => void;
	formValues: CommunityFormValues;
	isEditing: boolean;
	isLoadingData: boolean;
	isSaving: boolean;
	error: string | undefined;
	onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onPublicChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onPublicNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onPrivateNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onFormSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
	onCancelClick: () => void;
	hasUnsavedChanges: boolean;
	formRef: React.RefObject<HTMLFormElement | null>;
	getFieldError: (field: keyof CommunityFormValues) => ValidationError | undefined;
	submitButtonLabel: string;
};

/**
 * Custom hook encapsulating the form state/logic for creating/editing a
 * community.
 *
 * Manages field handlers, validation, submission, and navigation without
 * exposing implementation details to callers.
 *
 * @returns API surface consumed by the community form component
 */
export default function useCommunityForm(): UseCommunityFormReturn {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { community_id, lang } = useParams<{ community_id: string; lang: string }>();
	const { tags, getTags, setTags, isLoadingTags } = useItemTags("community", community_id);
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;

	const formRef = useRef<HTMLFormElement | null>(null);

	const isCommunitySaving = useAppStore((state) => state.isCommunitySaving);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const setCommunityError = useAppStore((state) => state.setCommunityError);
	const saveCommunity = useAppStore((state) => state.saveCommunity);
	const currentCommunity = useAppStore((state) => state.currentCommunity);

	const isEditing = community_id !== undefined && community_id !== "";

	const [formValues, setFormValues] = useState<CommunityFormValues>(() => ({
		community_id,
		name: "",
		slug: "",
		description: "",
		is_public: false,
		public_notes: "",
		private_notes: "",
	}));

	useLoadCommunityById(isEditing ? community_id : undefined);

	const { hasUnsavedChanges, setInitialState, clearInitialState } = useFormChanges({
		currentState: {
			formValues,
			tags,
		},
		enabled: !isCommunityLoading,
	});

	const hasLoadedRef = useRef(false);

	// Sync form values from store when editing.  This runs only once per
	// mount/unmount because we guard with `hasLoadedRef`, avoiding a loop that
	// would reset the form while the user is typing.
	useEffect(() => {
		if (
			isEditing &&
			currentCommunity &&
			currentCommunity.community_id === community_id &&
			!isLoadingTags &&
			!hasLoadedRef.current
		) {
			const loadedValues: CommunityFormValues = {
				community_id: currentCommunity.community_id,
				name: currentCommunity.community_name,
				slug: currentCommunity.community_slug,
				description: currentCommunity.description ?? "",
				is_public: currentCommunity.is_public,
				public_notes: currentCommunity.public_notes ?? "",
				private_notes: currentCommunity.private_notes ?? "",
			};
			setFormValues(loadedValues);
			setInitialState({
				formValues: loadedValues,
				tags,
			});
			hasLoadedRef.current = true;
		}
	}, [isEditing, currentCommunity, community_id, isLoadingTags, setInitialState, tags]);

	// Initialize the baseline state for Create flow immediately; prevents the
	// unsaved-changes tracker from thinking the form has already been altered.
	useEffect(() => {
		if (!isEditing && !hasLoadedRef.current) {
			setInitialState({
				formValues,
				tags,
			});
			hasLoadedRef.current = true;
		}
	}, [isEditing, setInitialState, formValues, tags]);

	// Clear community error when creating a new community
	useEffect(() => {
		if (!isEditing) {
			setCommunityError(undefined);
		}
	}, [isEditing, setCommunityError]);

	const { getFieldError, handleSubmit, isSubmitting } = useAppForm({
		schema: communityFormSchema,
		formRef,
		initialValues: formValues,
	});

	/**
	 * Update the `name` field and auto-generate `slug` when not editing.
	 *
	 * @param event - input change event for name field
	 * @returns void
	 */
	function onNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({
			...prev,
			name: value,
			slug: isEditing ? prev.slug : generateSlug(value),
		}));
	}

	/**
	 * Update the `slug` field with lower-cased input.
	 *
	 * @param event - input change event for slug field
	 * @returns void
	 */
	function onSlugChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, slug: value.toLowerCase() }));
	}

	/**
	 * Update the `description` field on user input.
	 *
	 * @param event - textarea change event for description
	 * @returns void
	 */
	function onDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, description: value }));
	}

	/**
	 * Toggle the `is_public` flag from a checkbox input.
	 *
	 * @param event - change event from the public checkbox
	 * @returns void
	 */
	function onPublicChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { checked } = event.target;
		setFormValues((prev) => ({ ...prev, is_public: checked }));
	}

	/**
	 * Update the `public_notes` field from a textarea.
	 *
	 * @param event - textarea change event for public notes
	 * @returns void
	 */
	function onPublicNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, public_notes: value }));
	}

	/**
	 * Update the `private_notes` field from a textarea.
	 *
	 * @param event - textarea change event for private notes
	 * @returns void
	 */
	function onPrivateNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, private_notes: value }));
	}

	/**
	 * Form submit handler that validates and delegates to async submit logic.
	 *
	 * @param event - native form submit event
	 * @returns void
	 */
	function onFormSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
		event.preventDefault();

		/**
		 * Called when the form is valid and should be submitted to the store.
		 *
		 * @returns Promise<void>
		 */
		async function onSubmitValid(): Promise<void> {
			try {
				const savedCommunity = await Effect.runPromise(
					saveCommunity({ ...formValues, tags: [...getTags()] }),
				);
				clearInitialState();
				void navigate(
					buildPathWithLang(`/${communityViewPath}/${savedCommunity.community_slug}`, langForNav),
				);
			} catch {
				// Error handled by store
			}
		}

		void Effect.runPromise(handleSubmit(formValues, onSubmitValid));
	}

	/**
	 * Navigate back to the previous page when the user cancels the form.
	 *
	 * @returns void
	 */
	function onCancelClick(): void {
		const PREVIOUS_PAGE = -1;
		void navigate(PREVIOUS_PAGE);
	}

	const isSaving = isCommunitySaving || isSubmitting;

	let submitButtonLabel = "";
	if (isSaving) {
		submitButtonLabel = t("common.saving", "Saving...");
	} else if (isEditing) {
		submitButtonLabel = t("common.save", "Save Changes");
	} else {
		submitButtonLabel = t("common.create", "Create Community");
	}

	return {
		tags,
		setTags,
		formValues,
		isEditing,
		isLoadingData: isEditing && (isCommunityLoading || isLoadingTags),
		isSaving,
		error: communityError,
		onNameChange,
		onSlugChange,
		onDescriptionChange,
		onPublicChange,
		onPublicNotesChange,
		onPrivateNotesChange,
		onFormSubmit,
		onCancelClick,
		hasUnsavedChanges: hasUnsavedChanges(),
		formRef,
		getFieldError,
		submitButtonLabel,
	};
}
