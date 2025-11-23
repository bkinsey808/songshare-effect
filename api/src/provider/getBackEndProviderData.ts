import type { ProviderType } from "@/shared/providers";

import { providerBackEndData } from "@/api/provider/providerBackEndData";
import { superSafeGet } from "@/shared/utils/safe";

export function getBackEndProviderData<T extends ProviderType>(
	provider: T,
): (typeof providerBackEndData)[T] {
	return superSafeGet(providerBackEndData, provider);
}
