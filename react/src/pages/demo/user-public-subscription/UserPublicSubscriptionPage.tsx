/* oxlint-disable max-lines */
import { ZERO } from "@/shared/constants/shared-constants";
import { formatAppDateTime } from "@/shared/utils/formatAppDate";

import getConnectionStatusClass from "./getConnectionStatusClass";
import useUserPublicSubscriptionPage from "./useUserPublicSubscriptionPage";

/**
 * Render the user public subscription demo page.
 *
 * Demonstrates subscribing to the `user_public` table via Supabase Realtime
 * and displays live user insert and update events.
 *
 * @returns A React element showing the current users list and realtime stream.
 */
// oxlint-disable-next-line max-lines-per-function
export default function UserPublicSubscriptionPage(): ReactElement {
	const { users, events, loading, error, connectionStatus } = useUserPublicSubscriptionPage();

	if (loading) {
		return <div className="text-center">Loading...</div>;
	}

	if (typeof error === "string" && error !== "") {
		return <div className="text-center text-red-500">{error}</div>;
	}

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">👥 User Public Subscription Demo</h2>
				<p className="text-gray-400">Real-time subscription to user_public table</p>
				<div className="mt-4">
					<span className="text-sm text-gray-500">Connection: </span>
					<span className={`font-bold ${getConnectionStatusClass(connectionStatus)}`}>
						{connectionStatus}
					</span>
					{connectionStatus === "CHANNEL_ERROR" && (
						<div className="mt-2 text-xs text-red-400">
							⚠️ Real-time connection failed. Check if the table has replication enabled.
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div>
					<h3 className="mb-4 text-xl font-semibold">Users ({users.length})</h3>
					{users.length === ZERO ? (
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-center text-gray-400">
							No users found in user_public table
						</div>
					) : (
						<div className="space-y-3">
							{users.map((user) => (
								<div
									key={user.user_id}
									className="rounded-lg border border-gray-600 bg-gray-800 p-4"
								>
									<div className="flex items-center justify-between">
										<span className="font-semibold text-white">{user.username}</span>
										<span className="text-xs text-gray-500">{user.user_id}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold">Real-time Events</h3>
					{events.length === ZERO ? (
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-center text-gray-400">
							No events yet. Try modifying the user_public table.
						</div>
					) : (
						<div className="max-h-96 space-y-3 overflow-y-auto">
							{events.map((event) => (
								<div
									key={`${event.timestamp}-${event.eventType}-${event.new?.user_id ?? event.old?.user_id ?? "unknown-user"}`}
									className="rounded-lg border border-gray-600 bg-gray-800 p-4"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-semibold text-white">{event.eventType}</span>
										<span className="text-xs text-gray-500">
											{formatAppDateTime(event.timestamp)}
										</span>
									</div>
									{event.new && (
										<div className="text-sm text-green-400">
											<strong>New:</strong> {event.new.username}
										</div>
									)}
									{event.old && (
										<div className="text-sm text-red-400">
											<strong>Old:</strong> {event.old.username}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="mt-10 rounded-lg border border-blue-600 bg-blue-900/20 p-6">
				<h3 className="mb-4 text-lg font-semibold text-blue-300">
					🔧 How to Test Real-time Updates
				</h3>
				<div className="space-y-3 text-sm text-blue-200">
					<p>To see real-time updates:</p>
					<ol className="ml-4 list-decimal space-y-1">
						<li>Open your Supabase Dashboard → Database → Replication</li>
						<li>Enable replication for the &quot;user_public&quot; table</li>
						<li>Use the SQL Editor or your database tool to modify the user_public table</li>
						<li>Changes will appear instantly here!</li>
					</ol>
				</div>
			</div>

			{connectionStatus === "CHANNEL_ERROR" && (
				<div className="mt-6 rounded-lg border border-red-600 bg-red-900/20 p-6">
					<h3 className="mb-4 text-lg font-semibold text-red-300">
						🚨 Troubleshooting CHANNEL_ERROR
					</h3>
					<div className="space-y-3 text-sm text-red-200">
						<p>
							<strong>Most likely cause:</strong> Real-time replication is not enabled for the
							user_public table.
						</p>
						<p>
							<strong>To fix:</strong>
						</p>
						<ol className="ml-4 list-decimal space-y-1">
							<li>Go to your Supabase Dashboard</li>
							<li>Navigate to Database → Replication</li>
							<li>Find the &quot;user_public&quot; table</li>
							<li>Toggle replication ON for this table</li>
							<li>Refresh this page</li>
						</ol>
						<p className="mt-3 text-xs">
							<strong>Alternative:</strong> Run this SQL command in your database:
							<code className="ml-2 rounded bg-red-800 px-2 py-1">
								ALTER TABLE user_public REPLICA IDENTITY FULL;
							</code>
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
