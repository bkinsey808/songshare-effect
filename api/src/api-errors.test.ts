import { describe, expect, it } from "vitest";

import {
	ValidationError,
	NotFoundError,
	DatabaseError,
	ServerError,
	ProviderError,
	FileUploadError,
	AuthenticationError,
	AuthorizationError,
} from "./api-errors";

describe("api error classes", () => {
	it("instantiates ValidationError with field", () => {
		const err = new ValidationError({ message: "bad", field: "email" });
		expect(err._tag).toBe("ValidationError");
		expect(err.message).toBe("bad");
		expect(err.field).toBe("email");
		expect(err).toBeInstanceOf(Error);
	});

	it("handles NotFoundError and optional id", () => {
		const nf = new NotFoundError({ message: "nf", resource: "user", id: "u1" });
		expect(nf._tag).toBe("NotFoundError");
		expect(nf.resource).toBe("user");
		expect(nf.id).toBe("u1");
	});

	it("databaseError/serverError carry cause", () => {
		const causeError = new Error("root");
		const dbErr = new DatabaseError({ message: "db", cause: causeError });
		const srvErr = new ServerError({ message: "srv", cause: causeError });
		expect(dbErr._tag).toBe("DatabaseError");
		expect(srvErr._tag).toBe("ServerError");
		expect(dbErr.cause).toBe(causeError);
		expect(srvErr.cause).toBe(causeError);
	});

	it("providerError and fileUploadError include optional fields", () => {
		const providerErr = new ProviderError({ message: "provider" });
		const fileErr = new FileUploadError({ message: "file", filename: "x.mp3" });
		expect(providerErr._tag).toBe("ProviderError");
		expect(fileErr._tag).toBe("FileUploadError");
		expect(fileErr.filename).toBe("x.mp3");
	});

	it("authenticationError and authorizationError", () => {
		const authErr = new AuthenticationError({ message: "noauth" });
		const authorizationErr = new AuthorizationError({ message: "denied", resource: "song" });
		expect(authErr._tag).toBe("AuthenticationError");
		expect(authorizationErr._tag).toBe("AuthorizationError");
		expect(authorizationErr.resource).toBe("song");
	});
});
