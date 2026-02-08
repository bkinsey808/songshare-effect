import { Provider, type ProviderType } from "@/shared/providers";
import { superSafeGet } from "@/shared/utils/safe";

import AmazonIcon from "./AmazonIcon";
import GoogleIcon from "./GoogleIcon";
import MicrosoftIcon from "./MicrosoftIcon";

type ProviderFrontEndData = {
	// main bg color
	brandColor: string;
	// text color
	textColor: string;
	// hover bg color
	hoverColor: string;
	// optional border color
	borderColor: string;
	// optional icon bg color
	iconBgColor: string;
	Icon: React.ComponentType<{
		className?: string;
		width?: string;
		height?: string;
	}>;
};

const providerFrontEndData: Record<ProviderType, ProviderFrontEndData> = {
	[Provider.google]: {
		// white background
		brandColor: "#fff",
		// Google gray
		textColor: "#3c4043",
		// Google hover
		hoverColor: "#f7f7f7",
		borderColor: "#dadce0",
		iconBgColor: "#fff",
		Icon: GoogleIcon,
	},
	[Provider.microsoft]: {
		// Microsoft dark
		brandColor: "#2F2F2F",
		textColor: "#fff",
		hoverColor: "#444",
		borderColor: "#444",
		iconBgColor: "#fff",
		Icon: MicrosoftIcon,
	},
	[Provider.amazon]: {
		// Amazon orange
		brandColor: "#FF9900",
		// Amazon dark blue
		textColor: "#232F3E",
		hoverColor: "#e48f00",
		borderColor: "#e48f00",
		iconBgColor: "#fff",
		Icon: AmazonIcon,
	},
} as const satisfies Record<ProviderType, ProviderFrontEndData>;

export default function getFrontEndProviderData<ProviderKey extends ProviderType>(
	provider: ProviderKey,
): (typeof providerFrontEndData)[ProviderKey] {
	return superSafeGet(providerFrontEndData, provider);
}
