import EventLibrary from "@/react/event-library/EventLibrary";

/**
 * Page that displays the user's event library and provides navigation hooks
 * for viewing and managing events.
 *
 * @returns - A React element that renders the `EventLibrary` component.
 */
export default function EventLibraryPage(): ReactElement {
	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">Event Library</h1>
				<p className="text-lg text-gray-300">Browse and manage your events</p>
			</div>

			<EventLibrary />
		</div>
	);
}
