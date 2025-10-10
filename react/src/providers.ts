import { AmazonIcon } from "./providers/AmazonIcon";
import { GoogleIcon } from "./providers/GoogleIcon";
import { MicrosoftIcon } from "./providers/MicrosoftIcon";
import { Provider, type ProviderType } from "@/shared/providers";
import { superSafeGet } from "@/shared/utils/safe";

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
	Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

export function getFrontEndProviderData<T extends ProviderType>(
	provider: T,
): (typeof providerFrontEndData)[T] {
	return superSafeGet(providerFrontEndData, provider);
}
