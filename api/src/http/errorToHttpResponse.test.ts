import { describe, expect, it } from "vitest";

import {
	AuthenticationError,
	AuthorizationError,
	DatabaseError,
	FileUploadError,
	NotFoundError,
	ServerError,
	ValidationError,
} from "@/api/api-errors";
import { HTTP_STATUS } from "@/shared/demo/api";

import errorToHttpResponse from "./errorToHttpResponse";

describe("errorToHttpResponse", () => {
	it("handles ValidationError with field", () => {
		const err = new ValidationError({ message: "Bad input", field: "email" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.BAD_REQUEST);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"Bad input"');
		expect(bodyStr).toContain('"field":"email"');
	});

	it("handles ValidationError without field", () => {
		const err = new ValidationError({ message: "Missing value" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.BAD_REQUEST);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"Missing value"');
	});

	it("handles NotFoundError with id", () => {
		const err = new NotFoundError({ message: "Not found", resource: "Song", id: "123" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.NOT_FOUND);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"resource":"Song"');
		expect(bodyStr).toContain('"id":"123"');
	});

	it("handles AuthenticationError", () => {
		const err = new AuthenticationError({ message: "No token" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.UNAUTHORIZED);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"No token"');
	});

	it("handles AuthorizationError with resource", () => {
		const err = new AuthorizationError({ message: "Forbidden", resource: "Playlist" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.FORBIDDEN);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"resource":"Playlist"');
	});

	it("returns actual DatabaseError message in development", () => {
		const err = new DatabaseError({ message: "DB crashed" });
		const { status, body } = errorToHttpResponse(err, { environment: "development" });
		expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"DB crashed"');
	});

	it("hides DatabaseError message outside development", () => {
		const err = new DatabaseError({ message: "DB leaked" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"Internal server error"');
	});

	it("handles FileUploadError like DatabaseError", () => {
		const err = new FileUploadError({ message: "Upload failed" });
		const { status, body } = errorToHttpResponse(err, { environment: "development" });
		expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"Upload failed"');
	});

	it("falls back to generic internal server error for unknown tags", () => {
		const err = new ServerError({ message: "weird" });
		const { status, body } = errorToHttpResponse(err);
		expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		const bodyStr = JSON.stringify(body);
		expect(bodyStr).toContain('"error":"Internal server error"');
	});
});
