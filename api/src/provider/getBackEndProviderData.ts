import type { ProviderType } from "@/shared/providers";

import { providerBackEndData } from "@/api/provider/providerBackEndData";
import { superSafeGet } from "@/shared/utils/safe";

export function getBackEndProviderData<ProviderName extends ProviderType>(
	provider: ProviderName,
): (typeof providerBackEndData)[ProviderName] {
	return superSafeGet(providerBackEndData, provider);
}
