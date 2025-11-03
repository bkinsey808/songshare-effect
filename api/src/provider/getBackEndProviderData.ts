import { providerBackEndData } from "./providerBackEndData";
import type { ProviderType } from "@/shared/providers";
import { superSafeGet } from "@/shared/utils/safe";

export function getBackEndProviderData<T extends ProviderType>(
	provider: T,
): (typeof providerBackEndData)[T] {
	return superSafeGet(providerBackEndData, provider);
}
