export default function resolveRedirectOrigin(
	envRedirectOrigin?: string,
	opts?: Readonly<{ requestOrigin?: string; isProd?: boolean }>,
): string {
	const envVal = envRedirectOrigin ?? "";
	const reqVal = opts?.requestOrigin ?? "";
	const isLocalhostEnv = envVal.includes("localhost");
	const isProd = Boolean(opts?.isProd);

	if (isLocalhostEnv && !isProd && reqVal) {
		return reqVal.replace(/\/$/, "");
	}

	if (envVal !== "") {
		return envVal.replace(/\/$/, "");
	}

	return reqVal.replace(/\/$/, "");
}
