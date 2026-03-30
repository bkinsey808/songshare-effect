import makeNull from "@/shared/test-utils/makeNull.test-util";

type EmptyResult = { data: unknown[]; error: ReturnType<typeof makeNull> };

type Chain = {
	select: () => Chain;
	eq: () => Chain;
	in: () => Chain;
	order: () => Chain;
};

/**
 * Returns a fake Supabase client whose from().select().eq().order() chain resolves to empty shares.
 * Used when share_public is not in makeSupabaseClient's table map.
 *
 * @returns A mock Supabase client object.
 */
export default function createShareListSupabaseMock(): { from: () => Chain } {
	const emptyResult: EmptyResult = {
		data: [],
		error: makeNull(),
	};

	const chain: Chain = {
		select: () => chain,
		eq: () => chain,
		in: () => chain,
		order: () => chain,
	};

	// Chain must be thenable so await query resolves; Object.assign mixes Promise into chain.
	// oxlint-disable-next-line promise/prefer-await-to-then -- Object.assign needs Promise for then/catch
	void Object.assign(chain, Promise.resolve(emptyResult));

	return {
		from: () => chain,
	};
}
