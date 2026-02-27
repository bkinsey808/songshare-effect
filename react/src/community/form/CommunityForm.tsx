import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";

import useCommunityForm from "./useCommunityForm";

export default function CommunityForm(): ReactElement {
	const { t } = useTranslation();
	const {
		formValues,
		isEditing,
		isSaving,
		error,
		onNameChange,
		onSlugChange,
		onDescriptionChange,
		onPublicChange,
		onPublicNotesChange,
		onPrivateNotesChange,
		onFormSubmit,
		onCancelClick,
		hasUnsavedChanges,
		formRef,
		submitButtonLabel,
	} = useCommunityForm();

	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			<h1 className="mb-6 text-3xl font-bold text-white">
				{isEditing
					? t("communityEdit.titleEdit", "Edit Community")
					: t("communityEdit.titleCreate", "Create Community")}
			</h1>

			{error !== undefined && error !== "" && (
				<div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300">
					{error}
				</div>
			)}

			<form ref={formRef} onSubmit={onFormSubmit} className="space-y-6">
				<div>
					<label htmlFor="community-name" className="mb-2 block text-sm font-medium text-white">
						{t("communityEdit.name", "Community Name")}
					</label>
					<input
						id="community-name"
						type="text"
						value={formValues.name}
						onChange={onNameChange}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						required
						minLength={2}
						maxLength={100}
					/>
				</div>

				<div>
					<label htmlFor="community-slug" className="mb-2 block text-sm font-medium text-white">
						{t("communityEdit.slug", "URL Slug")}
					</label>
					<input
						id="community-slug"
						type="text"
						value={formValues.slug}
						onChange={onSlugChange}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						required
						pattern="^[a-z0-9-]+$"
					/>
				</div>

				<div>
					<label
						htmlFor="community-description"
						className="mb-2 block text-sm font-medium text-white"
					>
						{t("communityEdit.description", "Description")}
					</label>
					<textarea
						id="community-description"
						value={formValues.description ?? ""}
						onChange={onDescriptionChange}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						rows={3}
					/>
				</div>

				<div className="flex items-center space-x-3 rounded-lg border border-gray-600 bg-gray-800 p-4">
					<input
						id="is-public"
						type="checkbox"
						checked={formValues.is_public ?? false}
						onChange={onPublicChange}
						className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
					/>
					<label htmlFor="is-public" className="text-sm font-medium text-white">
						{t("communityEdit.isPublic", "Make community public")}
					</label>
				</div>

				<div>
					<label htmlFor="public-notes" className="mb-2 block text-sm font-medium text-white">
						{t("communityEdit.publicNotes", "Public Notes")}
					</label>
					<textarea
						id="public-notes"
						value={formValues.public_notes ?? ""}
						onChange={onPublicNotesChange}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						rows={3}
					/>
				</div>

				<div>
					<label htmlFor="private-notes" className="mb-2 block text-sm font-medium text-white">
						{t("communityEdit.privateNotes", "Private Notes")}
					</label>
					<textarea
						id="private-notes"
						value={formValues.private_notes ?? ""}
						onChange={onPrivateNotesChange}
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
						rows={3}
					/>
				</div>

				<div className="flex justify-end space-x-4">
					<Button variant="outlineSecondary" onClick={onCancelClick}>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button
						type="submit"
						variant="primary"
						disabled={isSaving || (isEditing && !hasUnsavedChanges)}
					>
						{submitButtonLabel}
					</Button>
				</div>
			</form>
		</div>
	);
}
