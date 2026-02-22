import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useHydration from "@/react/app/useHydration";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockReactRouter from "@/react/lib/test-utils/mockReactRouter";
import mockTranslation from "@/react/lib/test-utils/mockTranslation";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

// DashboardPage (and its hooks) will be imported inside each test
// after applying our router mock. This avoids early imports that would
// capture the real `useNavigate` before our runtime mock is applied.
// We'll still import useDashboard since that's mocked separately below.
import useDashboard from "./useDashboard";

vi.mock("@/react/app/useHydration");
vi.mock("./useDashboard");

describe("dashboard page", () => {
	it("renders user library button and navigates when clicked", async () => {
		// Mock translation within the test to avoid top-level side effects
		mockTranslation();

		const mockNavigate = vi.fn();
		// replace built-in router mock with helper that returns our function
		mockReactRouter(mockNavigate);

		// Now that the router is mocked we can import DashboardPage so its
		// internal `useNavigate` will resolve to our stub.
		const { default: DashboardPage } = await import("./DashboardPage");

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
