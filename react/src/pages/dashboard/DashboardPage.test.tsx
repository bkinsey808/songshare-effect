import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useHydration from "@/react/app/useHydration";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockTranslation from "@/react/lib/test-utils/mockTranslation";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

import DashboardPage from "./DashboardPage";
import useDashboard from "./useDashboard";

vi.mock("@/react/app/useHydration");
vi.mock("./useDashboard");

// Mock react-router-dom with explicit type
// oxlint-disable-next-line jest/no-untyped-mock-factory
vi.mock("react-router-dom", async () => {
	// oxlint-disable-next-line @typescript-eslint/consistent-type-imports
	const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
	return {
		...actual,
		useNavigate: vi.fn(),
	};
});

describe("dashboard page", () => {
	it("renders user library button and navigates when clicked", () => {
		// Mock translation within the test to avoid top-level side effects
		mockTranslation();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		vi.mocked(useHydration).mockReturnValue({ isHydrated: true, awaitHydration: vi.fn() });

		const dashboardMockReturn: ReturnType<typeof useDashboard> = {
			localIsSignedIn: true,
			localUser: {
				user: {
					created_at: new Date().toISOString(),
					email: "test@example.com",
					google_calendar_access: "",
					name: "Test User",
					role: "user",
					updated_at: new Date().toISOString(),
					user_id: "00000000-0000-0000-0000-000000000000",
				},
				userPublic: forceCast(
					makeUserPublic({
						user_id: "00000000-0000-0000-0000-000000000000",
						username: "testuser",
					}),
				),
				oauthUserData: { email: "test@example.com" },
				oauthState: { csrf: "csrf", lang: "en", provider: "google" },
				ip: "127.0.0.1",
			},
			signOutRef: { current: () => undefined },
			signOut: vi.fn(),
			showSignedInAlert: false,
			showRegisteredAlert: false,
			showUnauthorizedAlert: false,
			setShowSignedInAlert: vi.fn(),
			setShowRegisteredAlert: vi.fn(),
			setShowUnauthorizedAlert: vi.fn(),
			currentLang: "en",
		};
		vi.mocked(useDashboard).mockReturnValue(dashboardMockReturn);

		const { getByTestId } = render(
			<MemoryRouter>
				<DashboardPage />
			</MemoryRouter>,
		);

		const btn = getByTestId("dashboard-user-library");
		expect(btn).toBeTruthy();

		fireEvent.click(btn);
		// Expect navigation to have been called with some path (string)
		expect(mockNavigate).toHaveBeenCalledWith(expect.any(String));
	});
});
