import { type ReactElement } from "react";

import DateTimePicker from "@/react/lib/design-system/date-time-picker/DateTimePicker";

import useEventForm from "./useEventForm";

/**
 * Event creation/edit form component.
 *
 * Renders a form for creating or editing an event with fields for:
 * - Event name and unique slug
 * - Description and date
 * - Public/private toggle
 * - Active playlist selection (inline search)
 * - Public and private notes
 *
 * @returns The event form UI
 */
export default function EventForm(): ReactElement {
	const {
		formValues,
		isEditing,
		isLoadingData,
		isSaving,
		isSubmitting,
		error,
		handleNameChange,
		handleDescriptionChange,
		handleDateChange,
		handleIsPublicChange,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		handleFormSubmit,
		handleCancel,
		resetForm,
		hasUnsavedChanges,
		formRef,
		t,
	} = useEventForm();

	if (isLoadingData) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("eventEdit.loading", "Loading event...")}</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mx-auto max-w-2xl px-4 py-6 pb-24">
				<h1 className="mb-6 text-2xl font-bold text-white">
					{isEditing
						? t("eventEdit.titleEdit", "Edit Event")
						: t("eventEdit.titleCreate", "Create New Event")}
				</h1>

				{typeof error === "string" && error !== "" && (
					<div className="mb-4 rounded-lg border border-red-600 bg-red-900/20 p-4">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				<form
					ref={formRef}
					onSubmit={(event) => {
						void handleFormSubmit(event);
					}}
					className="space-y-6"
				>
					{/* Event Name */}
					<div>
						<label htmlFor="event-name" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.name", "Event Name")}
						</label>
						<input
							id="event-name"
							name="event_name"
							type="text"
							value={formValues.event_name}
							onChange={(event) => {
								handleNameChange(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.namePlaceholder", "Enter event name")}
							required
							minLength={2}
							maxLength={100}
						/>
					</div>

					{/* Event Slug */}
					<div>
						<label htmlFor="event-slug" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.slug", "URL Slug")}
						</label>
						<input
							id="event-slug"
							name="event_slug"
							type="text"
							value={formValues.event_slug}
							onChange={(event) => {
								setEventSlug(event.target.value.toLowerCase());
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.slugPlaceholder", "event-url-slug")}
							required
							pattern="^[a-z0-9-]+$"
						/>
						<p className="mt-1 text-xs text-gray-400">
							{t("eventEdit.slugHint", "Only lowercase letters, numbers, and hyphens")}
						</p>
					</div>

					{/* Event Description */}
					<div>
						<label
							htmlFor="event-description"
							className="mb-2 block text-sm font-medium text-white"
						>
							{t("eventEdit.description", "Description")}
						</label>
						<textarea
							id="event-description"
							name="event_description"
							value={formValues.event_description ?? ""}
							onChange={(event) => {
								handleDescriptionChange(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.descriptionPlaceholder", "Event description")}
							rows={3}
						/>
					</div>

					{/* Event Date */}
					<DateTimePicker
						value={formValues.event_date ?? ""}
						onChange={handleDateChange}
						label={t("eventEdit.date", "Event Date")}
						placeholder="YYYY/MM/DD HH:mm"
						disablePastDates={!isEditing}
					/>
					{/* Public Toggle */}
					<div className="flex items-center space-x-3 rounded-lg border border-gray-600 bg-gray-800 p-4">
						<input
							id="is-public"
							name="is_public"
							type="checkbox"
							checked={formValues.is_public ?? false}
							onChange={(event) => {
								handleIsPublicChange(event.target.checked);
							}}
							className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
						/>
						<label htmlFor="is-public" className="text-sm font-medium text-white">
							{t("eventEdit.isPublic", "Make event public and discoverable")}
						</label>
					</div>

					{/* Public Notes */}
					<div>
						<label htmlFor="public-notes" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.publicNotes", "Public Notes")}
						</label>
						<textarea
							id="public-notes"
							name="public_notes"
							value={formValues.public_notes ?? ""}
							onChange={(event) => {
								setPublicNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.publicNotesPlaceholder", "Notes visible to everyone")}
							rows={3}
						/>
					</div>

					{/* Private Notes */}
					<div>
						<label htmlFor="private-notes" className="mb-2 block text-sm font-medium text-white">
							{t("eventEdit.privateNotes", "Private Notes")}
						</label>
						<textarea
							id="private-notes"
							name="private_notes"
							value={formValues.private_notes ?? ""}
							onChange={(event) => {
								setPrivateNotes(event.target.value);
							}}
							className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
							placeholder={t("eventEdit.privateNotesPlaceholder", "Notes only you can see")}
							rows={3}
						/>
					</div>
				</form>
			</div>

			{/* Form Footer - Fixed at bottom */}
			<div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-900 px-4 py-4">
				<div className="mx-auto max-w-2xl space-x-3">
					<button
						type="submit"
						onClick={() => {
							void handleFormSubmit();
						}}
						disabled={isSaving || isSubmitting}
						className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{isSaving || isSubmitting ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								{t("eventEdit.saving", "Saving...")}
							</>
						) : (
							t("eventEdit.submitLabel", "Save Event")
						)}
					</button>

					{hasUnsavedChanges && (
						<button
							type="button"
							onClick={resetForm}
							disabled={isSaving || isSubmitting}
							className="inline-flex items-center rounded-lg border border-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
						>
							{t("form.reset", "Reset")}
						</button>
					)}

					<button
						type="button"
						onClick={handleCancel}
						disabled={isSaving || isSubmitting}
						className="inline-flex items-center rounded-lg border border-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{t("form.cancel", "Cancel")}
					</button>
				</div>
			</div>
		</>
	);
}
