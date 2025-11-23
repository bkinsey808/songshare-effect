import { useEffect, useState } from "react";

import type { Tables } from "@/shared/generated/supabaseTypes";
import type {
	RealtimeChannel,
	RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { getSupabaseClientWithAuth } from "@/react/supabase/supabaseClient";

type UserPublic = Tables<"user_public">;

type RealtimeEvent = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new: UserPublic | undefined;
	old: UserPublic | undefined;
	timestamp: string;
};

// eslint-disable-next-line max-lines-per-function
function UserPublicSubscriptionPage(): ReactElement {
	const [users, setUsers] = useState<UserPublic[]>([]);
	const [events, setEvents] = useState<RealtimeEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);
	const [connectionStatus, setConnectionStatus] = useState("Disconnected");

	const getConnectionStatusClass = (status: string): string => {
		switch (status) {
			case "SUBSCRIBED":
				return "text-green-500";
			case "CHANNEL_ERROR":
				return "text-red-500";
			case "CLOSED":
				return "text-red-400";
			default:
				return "text-yellow-500";
		}
	};

	const handleRealtimeEvent = (
		// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- RealtimePostgresChangesPayload from Supabase is mutable
		payload: RealtimePostgresChangesPayload<UserPublic>,
		eventType: "INSERT" | "UPDATE" | "DELETE",
	): void => {
		const realtimeEvent: RealtimeEvent = {
			eventType,
			new: payload.new as UserPublic | undefined,
			old: payload.old as UserPublic | undefined,
			timestamp: new Date().toISOString(),
		};

		// Add to events log
		setEvents((prev) => [realtimeEvent, ...prev].slice(0, 10));

		// Update users list
		setUsers((prevUsers) => {
			switch (eventType) {
				case "INSERT": {
					// eslint-disable-next-line sonarjs/different-types-comparison
					if (payload.new !== undefined) {
						const newUser = payload.new as UserPublic;
						return [...prevUsers, newUser].sort((userA, userB) =>
							userA.username.localeCompare(userB.username),
						);
					}
					break;
				}
				case "UPDATE": {
					// eslint-disable-next-line sonarjs/different-types-comparison
					if (payload.new !== undefined) {
						const updatedUser = payload.new as UserPublic;
						return prevUsers
							.map((user) =>
								user.user_id === updatedUser.user_id ? updatedUser : user,
							)
							.sort((userA, userB) =>
								userA.username.localeCompare(userB.username),
							);
					}
					break;
				}
				case "DELETE": {
					// eslint-disable-next-line sonarjs/different-types-comparison
					if (payload.old !== undefined) {
						const deletedUser = payload.old as UserPublic;
						return prevUsers.filter(
							(user) => user.user_id !== deletedUser.user_id,
						);
					}
					break;
				}
				default:
					break;
			}
			return prevUsers;
		});
	};

	useEffect(() => {
		let channel: RealtimeChannel | undefined;

		const setupSubscription = async (): Promise<void> => {
			let supabase;

			// 1) Initialize Supabase client
			try {
				supabase = await getSupabaseClientWithAuth();
				if (!supabase) {
					setError("Failed to initialize Supabase client");
					setLoading(false);
					return;
				}
			} catch (err) {
				setError(
					`Setup error: ${err instanceof Error ? err.message : "Unknown"}`,
				);
				setLoading(false);
				return;
			}

			// 2) Initial fetch - be explicit about columns and keep parsing separate
			let fetchedData: UserPublic[] | null | undefined;
			try {
				const { data, error: fetchError } = await supabase
					.from("user_public")
					.select("user_id, username")
					.order("username");

				if (fetchError) {
					setError(`Failed to fetch users: ${fetchError.message}`);
					setLoading(false);
					return;
				}
				fetchedData = data;
			} catch (err) {
				setError("Failed to fetch users");
				console.error(err);
				setLoading(false);
				return;
			}

			// Set users using explicit checks (outside the fetch try/catch)
			if (Array.isArray(fetchedData)) {
				setUsers(fetchedData);
			} else {
				setUsers([]);
			}
			setLoading(false);

			// Give a small delay to ensure the client is fully initialized
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 3) Set up real-time subscription with comprehensive error handling
			try {
				console.warn("Setting up real-time subscription...");

				channel = supabase
					.channel(`user_public_changes_${Date.now()}`)
					.on(
						"postgres_changes",
						{
							event: "INSERT",
							schema: "public",
							table: "user_public",
						},
						(payload) => {
							console.warn("INSERT event received:", {
								event: payload.eventType,
								new: payload.new,
								old: payload.old,
								schema: payload.schema,
								table: payload.table,
							});
							try {
								handleRealtimeEvent(
									payload as RealtimePostgresChangesPayload<UserPublic>,
									"INSERT",
								);
							} catch (insertError) {
								console.error("Error handling INSERT event:", insertError);
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
							console.warn("UPDATE event received:", {
								event: payload.eventType,
								new: payload.new,
								old: payload.old,
								schema: payload.schema,
								table: payload.table,
							});
							try {
								handleRealtimeEvent(
									payload as RealtimePostgresChangesPayload<UserPublic>,
									"UPDATE",
								);
							} catch (updateError) {
								console.error("Error handling UPDATE event:", updateError);
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
							console.warn("DELETE event received:", {
								event: payload.eventType,
								new: payload.new,
								old: payload.old,
								schema: payload.schema,
								table: payload.table,
							});
							try {
								handleRealtimeEvent(
									payload as RealtimePostgresChangesPayload<UserPublic>,
									"DELETE",
								);
							} catch (deleteError) {
								console.error("Error handling DELETE event:", deleteError);
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
						if (subscriptionError) {
							console.error("Subscription error details:", {
								error: subscriptionError,
								message: subscriptionError.message ?? "Unknown error",
								stack: subscriptionError.stack ?? "No stack trace",
							});
							setError(
								`Subscription error: ${subscriptionError.message ?? JSON.stringify(subscriptionError)}`,
							);
						}
					});
			} catch (err) {
				setError(
					`Setup error: ${err instanceof Error ? err.message : "Unknown"}`,
				);
				setLoading(false);
			}
		};

		setupSubscription().catch(console.error);

		return () => {
			if (channel) {
				channel.unsubscribe().catch(console.error);
			}
		};
	}, []);

	if (loading) {
		return <div className="text-center">Loading...</div>;
	}

	if (error !== undefined && error.length > 0) {
		return <div className="text-center text-red-500">{error}</div>;
	}

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">
					👥 User Public Subscription Demo
				</h2>
				<p className="text-gray-400">
					Real-time subscription to user_public table
				</p>
				<div className="mt-4">
					<span className="text-sm text-gray-500">Connection: </span>
					<span
						className={`font-bold ${getConnectionStatusClass(connectionStatus)}`}
					>
						{connectionStatus}
					</span>
					{connectionStatus === "CHANNEL_ERROR" && (
						<div className="mt-2 text-xs text-red-400">
							⚠️ Real-time connection failed. Check if the table has replication
							enabled.
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div>
					<h3 className="mb-4 text-xl font-semibold">Users ({users.length})</h3>
					{users.length === 0 ? (
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
										<span className="font-semibold text-white">
											{user.username}
										</span>
										<span className="text-xs text-gray-500">
											{user.user_id}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold">Real-time Events</h3>
					{events.length === 0 ? (
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-center text-gray-400">
							No events yet. Try modifying the user_public table.
						</div>
					) : (
						<div className="max-h-96 space-y-3 overflow-y-auto">
							{events.map((event, index) => (
								<div
									key={index}
									className="rounded-lg border border-gray-600 bg-gray-800 p-4"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-semibold text-white">
											{event.eventType}
										</span>
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
						<li>Enable replication for the "user_public" table</li>
						<li>
							Use the SQL Editor or your database tool to modify the user_public
							table
						</li>
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
							<strong>Most likely cause:</strong> Real-time replication is not
							enabled for the user_public table.
						</p>
						<p>
							<strong>To fix:</strong>
						</p>
						<ol className="ml-4 list-decimal space-y-1">
							<li>Go to your Supabase Dashboard</li>
							<li>Navigate to Database → Replication</li>
							<li>Find the "user_public" table</li>
							<li>Toggle replication ON for this table</li>
							<li>Refresh this page</li>
						</ol>
						<p className="mt-3 text-xs">
							<strong>Alternative:</strong> Run this SQL command in your
							database:
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

export default UserPublicSubscriptionPage;
