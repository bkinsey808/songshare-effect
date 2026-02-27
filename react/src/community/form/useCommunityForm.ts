import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import type { ValidationError } from "@/shared/validation/validate-types";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/form/useAppForm";
import useFormChanges from "@/react/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { communityViewPath } from "@/shared/paths";
import { communityFormSchema } from "@/shared/validation/communitySchemas";

import type { CommunityFormValues } from "../community-types";

export type UseCommunityFormReturn = {
	formValues: CommunityFormValues;
	isEditing: boolean;
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

export default function useCommunityForm(): UseCommunityFormReturn {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { community_id, lang } = useParams<{ community_id: string; lang: string }>();
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;

	const formRef = useRef<HTMLFormElement | null>(null);

	const isCommunitySaving = useAppStore((state) => state.isCommunitySaving);
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

	const { hasUnsavedChanges, setInitialState, clearInitialState } = useFormChanges({
		currentState: formValues,
		enabled: true,
	});

	const hasLoadedRef = useRef(false);

	// Sync form values from store when editing
	useEffect(() => {
		if (
			isEditing &&
			currentCommunity &&
			currentCommunity.community_id === community_id &&
			!hasLoadedRef.current
		) {
			const loadedValues: CommunityFormValues = {
				community_id: currentCommunity.community_id,
				name: currentCommunity.name,
				slug: currentCommunity.slug,
				description: currentCommunity.description ?? "",
				is_public: currentCommunity.is_public,
				public_notes: currentCommunity.public_notes ?? "",
				private_notes: currentCommunity.private_notes ?? "",
			};
			setFormValues(loadedValues);
			setInitialState(loadedValues);
			hasLoadedRef.current = true;
		}
	}, [isEditing, currentCommunity, community_id, setInitialState]);

	// Initialize the baseline state for Create flow immediately
	useEffect(() => {
		if (!isEditing && !hasLoadedRef.current) {
			setInitialState(formValues);
			hasLoadedRef.current = true;
		}
	}, [isEditing, setInitialState, formValues]);

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

	function onNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({
			...prev,
			name: value,
			slug: isEditing ? prev.slug : generateSlug(value),
		}));
	}

	function onSlugChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, slug: value.toLowerCase() }));
	}

	function onDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, description: value }));
	}

	function onPublicChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const { checked } = event.target;
		setFormValues((prev) => ({ ...prev, is_public: checked }));
	}

	function onPublicNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, public_notes: value }));
	}

	function onPrivateNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const { value } = event.target;
		setFormValues((prev) => ({ ...prev, private_notes: value }));
	}

	function onFormSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
		event.preventDefault();

		async function onSubmitValid(): Promise<void> {
			try {
				const savedCommunity = await Effect.runPromise(saveCommunity(formValues));
				clearInitialState();
				void navigate(
					buildPathWithLang(`/${communityViewPath}/${savedCommunity.slug}`, langForNav),
				);
			} catch {
				// Error handled by store
			}
		}

		void Effect.runPromise(handleSubmit(formValues, onSubmitValid));
	}

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
		formValues,
		isEditing,
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
