/**
 * Test helper for imageDelete - builds a fake Supabase client with image_public and image tables.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type ImagePublicSelectResp = {
	data: { r2_key: string; user_id: string } | null;
	error: unknown;
};

type ImageDeleteResp = { data?: unknown; error?: unknown };

type ImageDeleteTestClientOpts = {
	imagePublicSelect?: ImagePublicSelectResp;
	imageDelete?: ImageDeleteResp;
};

type SingleBuilder = { single: () => Promise<ImagePublicSelectResp> };
type DeleteEqChain = { eq: (_field2: string, _val2: string) => Promise<ImageDeleteResp> };

/**
 * Builds a fake Supabase client for imageDelete tests.
 * @param opts - Mock configuration options.
 * @returns A mock Supabase client.
 */
export default function makeImageDeleteClient(
	opts: ImageDeleteTestClientOpts = {},
): ReturnType<typeof createClient> {
	const imagePublicSelect = opts.imagePublicSelect ?? {
		data: { r2_key: "images/user/img-1.png", user_id: "user-123" },
		error: undefined,
	};
	const imageDeleteResp = opts.imageDelete ?? { error: undefined };

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): unknown => {
			if (table === "image_public") {
				return {
					select: (_cols: string): { eq: (_field: string, _val: string) => SingleBuilder } => ({
						eq: (_field: string, _val: string): SingleBuilder => ({
							single: (): Promise<ImagePublicSelectResp> => promiseResolved(imagePublicSelect),
						}),
					}),
				};
			}
			if (table === "image") {
				return {
					delete: (): {
						eq: (_field: string, _val: string) => DeleteEqChain;
					} => ({
						eq: (_field: string, _val: string): DeleteEqChain => ({
							eq: (_field2: string, _val2: string): Promise<ImageDeleteResp> =>
								promiseResolved(imageDeleteResp),
						}),
					}),
				};
			}
			return undefined;
		},
	});
}
