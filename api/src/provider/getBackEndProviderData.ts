import { providerBackEndData } from "@/api/provider/providerBackEndData";
import { type ProviderType } from "@/shared/providers";
import { superSafeGet } from "@/shared/utils/safe";

/**
 * Retrieve backend configuration data for the given provider name.
 *
 * @param provider - The provider identifier to look up (e.g., `spotify`).
 * @returns - The backend configuration data for the specified provider.
 */
export default function getBackEndProviderData<ProviderName extends ProviderType>(
	provider: ProviderName,
): (typeof providerBackEndData)[ProviderName] {
	return superSafeGet(providerBackEndData, provider);
}
