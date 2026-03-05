import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { appStore } from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";
import type { UserSessionData } from "@/shared/userSessionData";

import ShareButton from "./ShareButton";

vi.mock("@/react/app-store/useAppStore");
vi.mock(
	"@/react/auth/useCurrentUserId",
	(): { default: () => string } => ({
		default: (): string => "test-user",
	}),
);
vi.mock(
	"@/react/user-search-input/UserSearchInput",
	(): { default: ({ label }: { label: string }) => ReactElement } => ({
		default: ({ label }: { label: string }): ReactElement => <div>{label}</div>,
	}),
);

const TEST_USER_SESSION: UserSessionData = {
	user: {
		created_at: new Date().toISOString(),
		email: "test@example.com",
		google_calendar_access: "",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: new Date().toISOString(),
		user_id: "test-user",
	},
	userPublic: forceCast(makeUserPublic({ user_id: "test-user", username: "testuser" })),
	oauthUserData: { email: "test@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("share button", () => {
	it("renders share button", () => {
		// Mock appStore for ShareButton
		vi.mocked(appStore).mockReturnValue(
			makeAppSlice({
				userSessionData: TEST_USER_SESSION,
				createShare: vi.fn(),
			}),
		);

		const { getByText } = render(
			<ShareButton
				itemType="song"
				itemId="test-song"
				itemName="Test Song"
			/>,
		);

		expect(getByText("Share")).toBeTruthy();
	});
});