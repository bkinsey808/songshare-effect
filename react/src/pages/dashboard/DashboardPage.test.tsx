import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useHydration from "@/react/app/useHydration";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockReactRouter from "@/react/lib/test-utils/mockReactRouter";
import mockTranslation from "@/react/lib/test-utils/mockTranslation";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";

// DashboardPage (and its hooks) will be imported inside each test
// after applying our router mock. This avoids early imports that would
// capture the real `useNavigate` before our runtime mock is applied.
// We'll still import useDashboard since that's mocked separately below.
import useDashboard from "./useDashboard";

vi.mock("@/react/app/useHydration");
vi.mock("./useDashboard");
vi.mock("@/react/share/shared-item-section/SharedItemsSection");
vi.mock("@/react/invitation/subscribe/useInvitationSubscription");
vi.mock("@/react/invitation/pending-invitation-section/PendingInvitationsSection");

describe("dashboard page", () => {
	it("renders dashboard content when signed in", async () => {
		mockTranslation();
		mockReactRouter(vi.fn());

		const { default: DashboardPage } = await import("./DashboardPage");

		vi.mocked(useHydration).mockReturnValue({ isHydrated: true, awaitHydration: vi.fn() });

		const dashboardMockReturn: ReturnType<typeof useDashboard> = {
			localIsSignedIn: true,
			localUser: forceCast(
				makeUserSessionData({
					user: {
						created_at: new Date().toISOString(),
						email: "test@example.com",
						updated_at: new Date().toISOString(),
						user_id: "00000000-0000-0000-0000-000000000000",
					},
					userPublic: {
						user_id: "00000000-0000-0000-0000-000000000000",
						username: "testuser",
					},
					oauthUserData: { email: "test@example.com" },
					oauthState: { csrf: "csrf", lang: "en", provider: "google" },
				}),
			),
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

		const { findByText } = render(
			<MemoryRouter>
				<DashboardPage />
			</MemoryRouter>,
		);

		await expect(findByText("Song Library", {}, { timeout: 5000 })).resolves.toBeTruthy();
	});
});
