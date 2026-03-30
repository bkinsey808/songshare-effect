import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import extractNewRecord from "@/react/lib/supabase/subscription/extract/extractNewRecord";
import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";

import guardAsImagePublic from "../guards/guardAsImagePublic";
import type { ImagePublic } from "../image-types";
import buildImageIdRealtimeFilter from "./buildImageIdRealtimeFilter";

type SubscribeToImagePublicEffectParams = {
	imageIds: readonly string[];
	onDelete?: (imageId: string) => void;
	onUpsert: (image: ImagePublic) => void;
};

const EMPTY_IMAGE_IDS = 0;

function handleImagePublicRealtimeEvent({
	payload,
	onDelete,
	onUpsert,
}: {
	payload: unknown;
	onDelete?: (imageId: string) => void;
	onUpsert: (image: ImagePublic) => void;
}): Effect.Effect<void, Error> {
	return Effect.sync(() => {
		if (!isRealtimePayload(payload)) {
			return;
		}

		if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
			const newRecord = extractNewRecord(payload);
			if (newRecord === undefined) {
				return;
			}

			onUpsert(guardAsImagePublic(newRecord, "image_public realtime"));
			return;
		}

		if (payload.eventType === "DELETE" && onDelete !== undefined) {
			const imageId = extractStringField(payload.old, "image_id");
			if (imageId !== undefined) {
				onDelete(imageId);
			}
		}
	});
}

/**
 * Subscribe to realtime updates for a scoped set of `image_public` rows.
 *
 * @param params - Subscription parameters.
 * @returns Effect that resolves to the cleanup function.
 */
export default function subscribeToImagePublicEffect({
	imageIds,
	onDelete,
	onUpsert,
}: SubscribeToImagePublicEffectParams): Effect.Effect<() => void, Error> {
	return Effect.gen(function* subscribeToImagePublicGen($) {
		const uniqueImageIds = [...new Set(imageIds)].filter((imageId) => imageId !== "");
		if (uniqueImageIds.length === EMPTY_IMAGE_IDS) {
			return (): void => {
				/* no-op */
			};
		}

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => Promise.resolve(getSupabaseAuthToken()),
				catch: (error) => new Error(String(error)),
			}),
		);

		const supabaseClient = getSupabaseClient(userToken);
		if (supabaseClient === undefined) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const cleanup = createRealtimeSubscription({
			client: supabaseClient,
			tableName: "image_public",
			filter: buildImageIdRealtimeFilter(uniqueImageIds),
			onEvent: (payload: unknown) =>
				handleImagePublicRealtimeEvent({
					payload,
					onUpsert,
					...(onDelete === undefined ? {} : { onDelete }),
				}),
		});

		return (): void => {
			cleanup();
		};
	});
}
