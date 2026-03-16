import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useLoadCommunityBySlug from "./useLoadCommunityBySlug";

const SLUG = "my-community";

/**
 * Harness for useLoadCommunityBySlug.
 * Mounts the hook with a slug and load function; the load function is called
 * when the slug is defined and the effect runs.
 */
function Harness(props: {
	communitySlug: string | undefined;
	loadCommunityBySlug: (slug: string, opts?: { silent?: boolean }) => Effect.Effect<unknown, Error>;
}): ReactElement {
	useLoadCommunityBySlug(props.communitySlug, props.loadCommunityBySlug);
	return <div data-testid="loader">slug={props.communitySlug ?? "none"}</div>;
}

describe("useLoadCommunityBySlug", () => {
	it("calls loadCommunityBySlug when slug is defined", async () => {
		const loadCommunityBySlug = vi.fn(() => Effect.void);

		render(<Harness communitySlug={SLUG} loadCommunityBySlug={loadCommunityBySlug} />);

		await waitFor(() => {
			expect(loadCommunityBySlug).toHaveBeenCalledWith(SLUG);
		});
	});

	it("does not call loadCommunityBySlug when slug is undefined", () => {
		const loadCommunityBySlug = vi.fn(() => Effect.void);

		render(<Harness communitySlug={undefined} loadCommunityBySlug={loadCommunityBySlug} />);

		expect(loadCommunityBySlug).not.toHaveBeenCalled();
	});

	it("does not call loadCommunityBySlug when slug is empty string", () => {
		const loadCommunityBySlug = vi.fn(() => Effect.void);

		render(<Harness communitySlug="" loadCommunityBySlug={loadCommunityBySlug} />);

		expect(loadCommunityBySlug).not.toHaveBeenCalled();
	});

	it("harness renders slug in DOM", () => {
		cleanup();
		render(<Harness communitySlug={SLUG} loadCommunityBySlug={() => Effect.void} />);

		expect(screen.getByTestId("loader").textContent).toContain(SLUG);
	});
});
