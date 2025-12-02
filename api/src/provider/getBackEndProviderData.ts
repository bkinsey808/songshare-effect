import { providerBackEndData } from "@/api/provider/providerBackEndData";
import { type ProviderType } from "@/shared/providers";
import { superSafeGet } from "@/shared/utils/safe";

export default function getBackEndProviderData<ProviderName extends ProviderType>(
	provider: ProviderName,
): (typeof providerBackEndData)[ProviderName] {
	return superSafeGet(providerBackEndData, provider);
}
