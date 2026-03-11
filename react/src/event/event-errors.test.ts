import { describe, expect, it } from "vitest";

import {
	EventNotFoundError,
	EventSaveApiError,
	EventSaveInvalidResponseError,
	EventUserJoinApiError,
	EventUserLeaveNetworkError,
	InvalidEventDataError,
	NoSupabaseClientError,
	QueryError,
	UnauthorizedError,
} from "./event-errors";

const TEST_SLUG = "my-event";
const TEST_MESSAGE = "query failed";
const STATUS_403 = 403;

describe("event-errors", () => {
	it("eventNotFoundError includes slug and message", () => {
		const err = new EventNotFoundError(TEST_SLUG);
		expect(err._tag).toBe("EventNotFoundError");
		expect(err.slug).toBe(TEST_SLUG);
		expect(err.message).toContain(TEST_SLUG);
	});

	it("noSupabaseClientError has expected message", () => {
		const err = new NoSupabaseClientError();
		expect(err._tag).toBe("NoSupabaseClientError");
		expect(err.message).toBe("No Supabase client available");
	});

	it("invalidEventDataError has expected message", () => {
		const err = new InvalidEventDataError();
		expect(err._tag).toBe("InvalidEventDataError");
		expect(err.message).toBe("Invalid event_public data");
	});

	it("queryError uses details when provided", () => {
		const details = "connection refused";
		const err = new QueryError(TEST_MESSAGE, details);
		expect(err._tag).toBe("QueryError");
		expect(err.details).toBe(details);
	});

	it("unauthorizedError has expected message", () => {
		const err = new UnauthorizedError();
		expect(err._tag).toBe("UnauthorizedError");
		expect(err.message).toBe("Not authorized to access this event");
	});

	it("eventSaveApiError includes statusCode when provided", () => {
		const err = new EventSaveApiError(TEST_MESSAGE, STATUS_403);
		expect(err._tag).toBe("EventSaveApiError");
		expect(err.statusCode).toBe(STATUS_403);
	});

	it("eventSaveInvalidResponseError has default message", () => {
		const cause = {};
		const err = new EventSaveInvalidResponseError(cause);
		expect(err._tag).toBe("EventSaveInvalidResponseError");
		expect(err.message).toBe("Invalid response from save API");
	});

	it("eventUserJoinApiError includes statusCode", () => {
		const err = new EventUserJoinApiError(TEST_MESSAGE, STATUS_403);
		expect(err._tag).toBe("EventUserJoinApiError");
		expect(err.statusCode).toBe(STATUS_403);
	});

	it("eventUserLeaveNetworkError has message", () => {
		const err = new EventUserLeaveNetworkError(TEST_MESSAGE);
		expect(err._tag).toBe("EventUserLeaveNetworkError");
		expect(err.message).toBe(TEST_MESSAGE);
	});
});
