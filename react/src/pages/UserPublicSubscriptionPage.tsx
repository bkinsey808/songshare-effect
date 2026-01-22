/* eslint-disable max-lines */
import { useEffect, useState } from "react";

import getSupabaseClientWithAuth from "@/react/supabase/client/getSupabaseClientWithAuth";
import guardAsFetchError from "@/react/supabase/client/guards/guardAsFetchError";
import guardAsPostgrestResponse from "@/react/supabase/client/guards/guardAsPostgrestResponse";
import guardAsRealtimeChannelLike from "@/react/supabase/client/guards/guardAsRealtimeChannelLike";
import {
	type RealtimeChannelLike,
	type SupabaseClientLike,
} from "@/react/supabase/client/SupabaseClientLike";
import { type Database, type Tables } from "@/shared/generated/supabaseTypes";
import { isRecord, isString } from "@/shared/utils/typeGuards";

type UserPublic = Tables<"user_public">;

type RealtimeEvent = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new: UserPublic | undefined;
	old: UserPublic | undefined;
	timestamp: string;
};

function isUserPublic(value: unknown): value is UserPublic {
	if (!isRecord(value)) {
		return false;
	}

	const { user_id: userId, username } = value;
	return isString(userId) && isString(username);
}

// File-local constants used by the component and helpers below
const EVENTS_MAX = 10;
const INIT_CLIENT_DELAY_MS = 100;
const ZERO = 0;

function getConnectionStatusClass(status: string): string {
	switch (status) {
		case "SUBSCRIBED": {
			return "text-green-500";
		}
		case "CHANNEL_ERROR": {
			return "text-red-500";
		}
		case "CLOSED": {
			return "text-red-400";
		}
		default: {
			return "text-yellow-500";
		}
	}
}

type SetEvents = React.Dispatch<React.SetStateAction<RealtimeEvent[]>>;
type SetUsers = React.Dispatch<React.SetStateAction<UserPublic[]>>;

/**
 * Top-level helper so the main component function stays under the max-lines
 * limit enforced by the linter.
 */
function handleRealtimeEvent({
	payload,
	eventType,
	setEvents,
	setUsers,
}: {
	payload: unknown;
	eventType: "INSERT" | "UPDATE" | "DELETE";
	setEvents: SetEvents;
	setUsers: SetUsers;
}): void {
	// The Supabase realtime payload is untyped here, so treat it as unknown and
	// guard before reading the `new` and `old` fields.
	let newRaw: unknown = undefined;
	let oldRaw: unknown = undefined;

	if (isRecord(payload)) {
		newRaw = payload["new"];
		oldRaw = payload["old"];
	}
	const realtimeEvent: RealtimeEvent = {
		eventType,
		new: isUserPublic(newRaw) ? newRaw : undefined,
		old: isUserPublic(oldRaw) ? oldRaw : undefined,
		timestamp: new Date().toISOString(),
	};

	// Add to events log
	setEvents((prev) => [realtimeEvent, ...prev].slice(ZERO, EVENTS_MAX));

	// Update users list
	setUsers((prevUsers) => {
		switch (eventType) {
			case "INSERT": {
				if (realtimeEvent.new !== undefined) {
					const newUser = realtimeEvent.new;
					// oxlint-disable-next-line unicorn/no-array-sort
					return [...prevUsers, newUser].sort((userA, userB) =>
						userA.username.localeCompare(userB.username),
					);
				}
				break;
			}
			case "UPDATE": {
				if (realtimeEvent.new !== undefined) {
					const updatedUser = realtimeEvent.new;
					return (
						prevUsers
							.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
							// oxlint-disable-next-line unicorn/no-array-sort
							.sort((userA, userB) => userA.username.localeCompare(userB.username))
					);
				}
				break;
			}
			case "DELETE": {
				if (realtimeEvent.old !== undefined) {
					const deletedUser = realtimeEvent.old;
					return prevUsers.filter((user) => user.user_id !== deletedUser.user_id);
				}
				break;
			}
		}
		return prevUsers;
	});
}

export default function UserPublicSubscriptionPage(): ReactElement {
	const [users, setUsers] = useState<UserPublic[]>([]);
	const [events, setEvents] = useState<RealtimeEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);
	const [connectionStatus, setConnectionStatus] = useState("Disconnected");

	// NOTE: constants and helper `handleRealtimeEvent` are defined at module scope

	// Use shared isRecord/isString guards (imported at top) for runtime narrowing

	useEffect(() => {
		let channel: RealtimeChannelLike | undefined = undefined;

		async function setupSubscription(): Promise<void> {
			let supabase: SupabaseClientLike<Database> | undefined = undefined;

			// 1) Initialize Supabase client
			try {
				supabase = await getSupabaseClientWithAuth();
				if (!supabase) {
					setError("Failed to initialize Supabase client");
					setLoading(false);
					return;
				}
			} catch (error) {
				setError(`Setup error: ${error instanceof Error ? error.message : "Unknown"}`);
				setLoading(false);
				return;
			}

			// 2) Initial fetch - be explicit about columns and keep parsing separate
			let fetchedData: UserPublic[] | null | undefined = undefined;
			let result: unknown = undefined;

			try {
				if (supabase === undefined) {
					setError("Supabase client is undefined");
					return;
				}

				const query = supabase.from("user_public").select("user_id, username");
				const queryObj = query as { order?: (column: string) => Promise<unknown> };
				const orderFn = queryObj.order;

				if (typeof orderFn !== "function") {
					setError("Supabase client missing order helper");
					return;
				}

				result = await orderFn("username");
			} catch (error) {
				setError("Failed to fetch users");
				console.error(error);
				setLoading(false);
				return;
			}

			// Process result outside try/catch to avoid React Compiler value block limitation
			if (!guardAsPostgrestResponse(result)) {
				setError("Invalid response format");
				setLoading(false);
				return;
			}

			const { error: fetchError, data } = result;
			if (fetchError !== undefined && guardAsFetchError(fetchError)) {
				setError(`Failed to fetch users: ${fetchError.message}`);
				setLoading(false);
				return;
			}

			fetchedData = Array.isArray(data)
				? data.filter((item): item is UserPublic => isUserPublic(item))
				: undefined;

			// Set users using explicit checks (outside the fetch try/catch)
			if (Array.isArray(fetchedData)) {
				setUsers(fetchedData);
			} else {
				setUsers([]);
			}
			setLoading(false);

			// Give a small delay to ensure the client is fully initialized
			// oxlint-disable-next-line promise/avoid-new
			await new Promise((resolve) => setTimeout(resolve, INIT_CLIENT_DELAY_MS));

			// 3) Set up real-time subscription with comprehensive error handling
			try {
				console.warn("Setting up real-time subscription...");

				if (supabase === undefined) {
					setError("Supabase client is undefined for realtime setup");
					return;
				}

				const channelCandidate = supabase
					.channel(`user_public_changes_${Date.now()}`)
					.on(
						"postgres_changes",
						{
							event: "INSERT",
							schema: "public",
							table: "user_public",
						},
						(payload) => {
							if (isRecord(payload)) {
								console.warn("INSERT event received:", {
									event: payload["eventType"],
									new: payload["new"],
									old: payload["old"],
									schema: payload["schema"],
									table: payload["table"],
								});
							} else {
								console.warn("INSERT event received with unknown payload shape", payload);
							}
							try {
								handleRealtimeEvent({
									payload,
									eventType: "INSERT",
									setEvents,
									setUsers,
								});
							} catch (error) {
								console.error("Error handling INSERT event:", error);
							}
						},
					)
					.on(
						"postgres_changes",
						{
							event: "UPDATE",
							schema: "public",
							table: "user_public",
						},
						(payload) => {
							if (isRecord(payload)) {
								console.warn("UPDATE event received:", {
									event: payload["eventType"],
									new: payload["new"],
									old: payload["old"],
									schema: payload["schema"],
									table: payload["table"],
								});
							} else {
								console.warn("UPDATE event received with unknown payload shape", payload);
							}
							try {
								handleRealtimeEvent({
									payload,
									eventType: "UPDATE",
									setEvents,
									setUsers,
								});
							} catch (error) {
								console.error("Error handling UPDATE event:", error);
							}
						},
					)
					.on(
						"postgres_changes",
						{
							event: "DELETE",
							schema: "public",
							table: "user_public",
						},
						(payload) => {
							if (isRecord(payload)) {
								console.warn("DELETE event received:", {
									event: payload["eventType"],
									new: payload["new"],
									old: payload["old"],
									schema: payload["schema"],
									table: payload["table"],
								});
							} else {
								console.warn("DELETE event received with unknown payload shape", payload);
							}
							try {
								handleRealtimeEvent({
									payload,
									eventType: "DELETE",
									setEvents,
									setUsers,
								});
							} catch (error) {
								console.error("Error handling DELETE event:", error);
							}
						},
					)
					.subscribe((status, subscriptionError) => {
						console.warn("Subscription status changed:", {
							status,
							error: subscriptionError,
							timestamp: new Date().toISOString(),
						});
						setConnectionStatus(status);
						if (subscriptionError !== undefined && subscriptionError !== null) {
							const subscriptionMessage =
								isRecord(subscriptionError) && typeof subscriptionError["message"] === "string"
									? subscriptionError["message"]
									: JSON.stringify(subscriptionError);
							const subscriptionStack =
								isRecord(subscriptionError) && typeof subscriptionError["stack"] === "string"
									? subscriptionError["stack"]
									: "No stack trace";
							console.error("Subscription error details:", {
								error: subscriptionError,
								message: subscriptionMessage,
								stack: subscriptionStack,
							});
							setError(`Subscription error: ${subscriptionMessage}`);
						}
					});

				channel = guardAsRealtimeChannelLike(channelCandidate);
			} catch (error) {
				setError(`Setup error: ${error instanceof Error ? error.message : "Unknown"}`);
				setLoading(false);
			}
		}

		void (async (): Promise<void> => {
			try {
				await setupSubscription();
			} catch (error) {
				console.error(error);
			}
		})();

		return (): void => {
			if (channel) {
				void (async (): Promise<void> => {
					try {
						const { unsubscribe } = channel;
						if (typeof unsubscribe === "function") {
							await unsubscribe();
						}
					} catch (error) {
						console.error(error);
					}
				})();
			}
		};
	}, []);

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
							{events.map((event, index) => (
								<div
									key={`${event.timestamp}-${event.eventType}-${event.new?.user_id ?? event.old?.user_id ?? index}`}
									className="rounded-lg border border-gray-600 bg-gray-800 p-4"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-semibold text-white">{event.eventType}</span>
										<span className="text-xs text-gray-500">
											{new Date(event.timestamp).toLocaleTimeString()}
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
