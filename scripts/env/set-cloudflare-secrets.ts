import { parseListLines } from "./env-utils";

const MIN_LINE_LENGTH = 1;

export function parseWorkerVarNames(text: string): string[] {
	return parseListLines(text, MIN_LINE_LENGTH);
}

export function resolveServiceName(envArg: string, serviceArg: string | undefined): string {
	return serviceArg === undefined || serviceArg === "" ? `songshare-${envArg}` : serviceArg;
}
