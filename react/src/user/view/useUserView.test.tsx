import { render, renderHook, waitFor } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import forceCast from "@/react/lib/test-utils/forceCast";

import useUserView from "./useUserView";

vi.mock("react-router-dom");
vi.mock("@/react/lib/supabase/client/getSupabaseClientWithAuth");

type QueryResponse = {
	data?: unknown;
	error?: unknown;
};

type QueryBuilder = {
	eq?: (column: string, value: string) => { single: () => Promise<QueryResponse> };
};

type ClientLike = {
	from: (table: string) => { select: (cols: string) => QueryBuilder };
};

function resolveResponse(response: QueryResponse): Promise<QueryResponse> {
	return Promise.resolve(response);
}

function makeClient(response: QueryResponse): ClientLike {
	return {
		from: (): { select: (cols: string) => QueryBuilder } => ({
			select: (): QueryBuilder => ({
				eq: (): { single: () => Promise<QueryResponse> } => ({
					single: (): Promise<QueryResponse> => resolveResponse(response),
				}),
			}),
		}),
	};
}

function makeClientWithMissingEq(): ClientLike {
	return {
		from: (): { select: (cols: string) => QueryBuilder } => ({
			select: (): QueryBuilder => ({}),
		}),
	};
}

/**
 * Harness for useUserView.
 *
 * Shows how useUserView is consumed in a UI context:
 * - Displays route username and derived userPublic
 * - Renders loading and error states
 */
function Harness(): ReactElement {
	const { username, userPublic, isLoading, error } = useUserView();

	return (
		<div>
			<div data-testid="username">{String(username ?? "")}</div>
			<div data-testid="user-id">{String(userPublic?.user_id ?? "")}</div>
			<div data-testid="user-name">{String(userPublic?.username ?? "")}</div>
			<div data-testid="loading">{String(isLoading)}</div>
			<div data-testid="error">{String(error ?? "")}</div>
		</div>
	);
}

describe("useUserView — Harness", () => {
	it("renders user details when found", async () => {
		vi.mocked(useParams).mockReturnValue({ username: "mettaben" });
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(
			forceCast(
				makeClient({
					data: { user_id: "user-1", username: "mettaben" },
					error: undefined,
				}),
			),
		);

		const { getByTestId } = render(<Harness />);

		await waitFor(() => {
			expect(getByTestId("user-id").textContent).toBe("user-1");
			expect(getByTestId("user-name").textContent).toBe("mettaben");
			expect(getByTestId("error").textContent).toBe("");
		});
	});
});

describe("useUserView — renderHook", () => {
	it("returns not found when the query returns null data", async () => {
		vi.mocked(useParams).mockReturnValue({ username: "ghost" });
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(
			forceCast(makeClient({ data: undefined, error: undefined })),
		);

		const { result } = renderHook(() => useUserView());

		await waitFor(() => {
			expect(result.current.error).toBe("User not found");
			expect(result.current.userPublic).toBeUndefined();
		});
	});

	it("returns error when supabase client is unavailable", async () => {
		vi.mocked(useParams).mockReturnValue({ username: "mettaben" });
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(undefined);

		const { result } = renderHook(() => useUserView());

		await waitFor(() => {
			expect(result.current.error).toBe("User lookup is unavailable.");
		});
	});

	it("returns error when query builder lacks eq", async () => {
		vi.mocked(useParams).mockReturnValue({ username: "mettaben" });
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(forceCast(makeClientWithMissingEq()));

		const { result } = renderHook(() => useUserView());

		await waitFor(() => {
			expect(result.current.error).toBe("User lookup is unavailable.");
		});
	});

	it("trims the username param before lookup", async () => {
		vi.mocked(useParams).mockReturnValue({ username: "  mettaben  " });
		vi.mocked(getSupabaseClientWithAuth).mockResolvedValue(
			forceCast(
				makeClient({
					data: { user_id: "user-1", username: "mettaben" },
					error: undefined,
				}),
			),
		);

		const { result } = renderHook(() => useUserView());

		await waitFor(() => {
			expect(result.current.username).toBe("mettaben");
			expect(result.current.userPublic?.username).toBe("mettaben");
		});
	});
});
