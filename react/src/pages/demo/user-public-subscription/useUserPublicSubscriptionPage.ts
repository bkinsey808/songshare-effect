import { useEffect, useState } from "react";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import guardAsPostgrestResponse from "@/react/lib/supabase/client/guards/guardAsPostgrestResponse";
import guardAsRealtimeChannelLike from "@/react/lib/supabase/client/guards/guardAsRealtimeChannelLike";
import {
    type RealtimeChannelLike,
    type SupabaseClientLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import extractErrorStack from "@/shared/error-message/extractErrorStack";
import { type Database } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";

import { handleRealtimeEvent, type RealtimeEvent } from "./handleRealtimeEvent";
import { isUserPublic, type UserPublic } from "./isUserPublic";

const INIT_CLIENT_DELAY_MS = 100;

type UserPublicSubscriptionPageState = {
	users: UserPublic[];
	events: RealtimeEvent[];
	loading: boolean;
	error: string | undefined;
	connectionStatus: string;
};

/**
 * Provides state and side effects for the user public subscription demo page.
 *
 * @returns Subscription page state used by the UI component.
 */
export default function useUserPublicSubscriptionPage(): UserPublicSubscriptionPageState {
	const [users, setUsers] = useState<UserPublic[]>([]);
	const [events, setEvents] = useState<RealtimeEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);
	const [connectionStatus, setConnectionStatus] = useState("Disconnected");

	// Set up the user_public real-time subscription and initial fetch on mount.
	useEffect(() => {
		let channel: RealtimeChannelLike | undefined = undefined;

				/**
				 * Initialize Supabase client, fetch initial users list, and set up realtime
				 * subscription handlers for user_public.
				 *
				 * @returns Promise<void> resolved when setup completes
				 */
				async function setupSubscription(): Promise<void> {
			let supabase: SupabaseClientLike<Database> | undefined = undefined;

			try {
				supabase = await getSupabaseClientWithAuth();
				if (!supabase) {
					setError("Failed to initialize Supabase client");
					setLoading(false);
					return;
				}

				let fetchedData: UserPublic[] | null | undefined = undefined;
				let result: unknown = undefined;

				try {
					if (supabase === undefined) {
						setError("Supabase client is undefined");
						setLoading(false);
						return;
					}
					const query = supabase.from("user_public").select("user_id, username");
					const queryObj = query as { order?: (column: string) => Promise<unknown> };

					if (typeof queryObj.order !== "function") {
						setError("Supabase client missing order helper");
						setLoading(false);
						return;
					}
					try {
						result = await queryObj.order.call(query, "username");
					} catch (error) {
						console.error("Error calling queryObj.order", { query, queryObj, error: error });
						setError(`Failed to fetch users: ${extractErrorMessage(error, "Unknown")}`);
						setLoading(false);
						return;
					}
				} catch (error) {
					setError("Failed to fetch users");
					console.error(error);
					setLoading(false);
					return;
				}

				if (!guardAsPostgrestResponse(result)) {
					setError("Invalid response format");
					setLoading(false);
					return;
				}

				const { error: fetchError, data } = result;
				if (fetchError !== undefined) {
					setError(
						`Failed to fetch users: ${extractErrorMessage(fetchError, "Failed to fetch users")}`,
					);
					setLoading(false);
					return;
				}

				if (Array.isArray(data)) {
					fetchedData = data.filter((item): item is UserPublic => isUserPublic(item));
				} else {
					fetchedData = undefined;
				}

				if (Array.isArray(fetchedData)) {
					setUsers(fetchedData);
				} else {
					setUsers([]);
				}

				// oxlint-disable-next-line promise/avoid-new
				await new Promise((resolve) => setTimeout(resolve, INIT_CLIENT_DELAY_MS));

				console.warn("Setting up real-time subscription...");

				if (supabase === undefined) {
					setError("Supabase client is undefined for realtime setup");
					setLoading(false);
					return;
				}

				if (typeof supabase.channel !== "function") {
					setError("Supabase client does not support realtime channels");
					setLoading(false);
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
							const subscriptionMessage = extractErrorMessage(
								subscriptionError,
								JSON.stringify(subscriptionError),
							);
							const subscriptionStack = extractErrorStack(subscriptionError, "No stack trace");
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
				setError(`Setup error: ${extractErrorMessage(error, "Unknown")}`);
				setLoading(false);
			}
		}

		void (async (): Promise<void> => {
			try {
				await setupSubscription();
			} catch (error) {
				console.error(error);
				setError(`Setup error: ${extractErrorMessage(error, "Unknown")}`);
				setLoading(false);
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

	return {
		users,
		events,
		loading,
		error,
		connectionStatus,
	};
}
