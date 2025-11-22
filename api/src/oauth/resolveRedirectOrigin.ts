export function resolveRedirectOrigin(
	envRedirectOrigin?: string | undefined,
	opts?: Readonly<{ requestOrigin?: string | undefined; isProd?: boolean }>,
): string {
	const envVal = (envRedirectOrigin ?? "").toString();
	const reqVal = (opts?.requestOrigin ?? "").toString();
	const isLocalhostEnv = /localhost/.test(envVal);
	const isProd = Boolean(opts?.isProd);

	if (isLocalhostEnv && !isProd && reqVal) {
		return reqVal.replace(/\/$/, "");
	}

	if (typeof envVal === "string" && envVal !== "") {
		return envVal.replace(/\/$/, "");
	}

	return reqVal.replace(/\/$/, "");
}

export default resolveRedirectOrigin;
