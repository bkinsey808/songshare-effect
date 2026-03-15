import { type ComponentType, useState } from "react";
import QRCode from "react-qr-code";

import Button from "@/react/lib/design-system/Button";
import isRecord from "@/shared/type-guards/isRecord";

type CollapsibleQrCodeProps = Readonly<{
	url: string;
	label: string;
	className?: string;
}>;

/**
 * Collapsible QR code panel for sharing a public URL.
 *
 * @param url - Fully-qualified URL to encode
 * @param label - Short label describing what the QR code opens
 * @param className - Optional extra class names to apply
 * @returns A collapsible QR code panel
 */
type QRCodeComponentProps = { value: string; size?: number };

function isComponentType(value: unknown): value is ComponentType<QRCodeComponentProps> {
	return typeof value === "function";
}

function resolveQRCodeComponent(value: unknown): ComponentType<QRCodeComponentProps> {
	if (isRecord(value) && "default" in value && isComponentType(value["default"])) {
		return value["default"];
	}
	if (isComponentType(value)) {
		return value;
	}
	return () => undefined;
}

const QRCodeComponent = resolveQRCodeComponent(QRCode);

export default function CollapsibleQrCode({
	url,
	label,
	className = "",
}: CollapsibleQrCodeProps): ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<section className={`rounded-lg border border-gray-700 bg-gray-800 p-4 ${className}`.trim()}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-sm text-gray-400">QR code</p>
					<p className="text-base font-semibold text-white">{label}</p>
				</div>
				<Button
					variant="outlineSecondary"
					size="compact"
					onClick={() => {
						setIsOpen((prev) => !prev);
					}}
				>
					{isOpen ? "Hide QR" : "Show QR"}
				</Button>
			</div>

			{isOpen && (
				<div className="mt-4 flex flex-col items-center gap-3">
					<div className="rounded bg-white p-3">
						<QRCodeComponent value={url} size={176} />
					</div>
					<p className="max-w-full break-all text-xs text-gray-400">{url}</p>
				</div>
			)}
		</section>
	);
}
