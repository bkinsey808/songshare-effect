import { Effect } from "effect";

export default function fetchTagEffect(path: string, body: object): Effect.Effect<Response, Error> {
	return Effect.tryPromise({
		try: () =>
			fetch(path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
				credentials: "include",
			}),
		catch: (error) => new Error(String(error)),
	});
}
