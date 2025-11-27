import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import { NativePopover } from "@/react/popover/NativePopover";

function NativePopoverSection(): ReactElement {
	return (
		<section className="rounded-lg border border-white/10 bg-white/5 p-6">
			<h2 className="mb-4 text-2xl font-bold text-blue-300">
				🆕 Native Popover API (2024)
			</h2>
			<p className="mb-6 text-gray-300">
				The native HTML popover attribute provides built-in popover
				functionality with automatic positioning, focus management, and
				accessibility features.
			</p>

			<div className="mb-6 flex flex-wrap gap-4">
				<button
					type="button"
					{...({ popoverTarget: "native-popover" as string } as Record<
						string,
						unknown
					>)}
					className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
				>
					Open Native Popover
				</button>

				<button
					type="button"
					{...({
						popoverTarget: "manual-popover" as string,
						popoverTargetAction: "toggle" as string,
					} as Record<string, unknown>)}
					className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
				>
					Toggle Manual Popover
				</button>
			</div>

			<div
				id="native-popover"
				{...({ popover: "auto" as string } as Record<string, unknown>)}
				className="max-w-sm rounded-lg bg-gray-800 p-4 shadow-lg ring-1 ring-white/10"
			>
				<h3 className="mb-2 font-semibold text-white">Auto Popover</h3>
				<p className="text-gray-300">
					This popover uses the native{" "}
					<code className="rounded bg-gray-700 px-1">popover="auto"</code>{" "}
					attribute. It automatically handles focus management, ESC key closing,
					and click-outside behavior.
				</p>
				<button
					type="button"
					{...({
						popoverTarget: "native-popover" as string,
						popoverTargetAction: "hide" as string,
					} as Record<string, unknown>)}
					className="mt-3 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
				>
					Close
				</button>
			</div>

			<div
				id="manual-popover"
				{...({ popover: "manual" as string } as Record<string, unknown>)}
				className="max-w-sm rounded-lg bg-gray-800 p-4 shadow-lg ring-1 ring-white/10"
			>
				<h3 className="mb-2 font-semibold text-white">Manual Popover</h3>
				<p className="text-gray-300">
					This popover uses{" "}
					<code className="rounded bg-gray-700 px-1">popover="manual"</code>. It
					requires explicit JavaScript control and doesn't auto-close.
				</p>
				<button
					type="button"
					{...({
						popoverTarget: "manual-popover" as string,
						popoverTargetAction: "hide" as string,
					} as Record<string, unknown>)}
					className="mt-3 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
				>
					Close
				</button>
			</div>
		</section>
	);
}

function PopoverDemoGrid(): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			<div className="text-center">
				<h3 className="mb-3 font-semibold">Native Hover Top</h3>
				<NativePopover
					trigger="hover"
					preferredPlacement="top"
					closeOnTriggerClick={true}
					content={
						<div className="overflow-hidden">
							<h4 className="mb-2 font-semibold text-white">
								Hover Trigger - Top
							</h4>
							<p className="text-sm leading-relaxed text-gray-300">
								Uses native Popover API with hover trigger and preference for
								top placement. Will flip to bottom if near top edge.
							</p>
						</div>
					}
				>
					<span className="rounded-lg bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600">
						Hover Top
					</span>
				</NativePopover>
			</div>

			<div className="text-center">
				<h3 className="mb-3 font-semibold">Native Click Bottom</h3>
				<NativePopover
					trigger="click"
					preferredPlacement="bottom"
					content={
						<div className="overflow-hidden">
							<h4 className="mb-2 font-semibold text-white">
								Click Trigger - Bottom
							</h4>
							<p className="text-sm leading-relaxed text-gray-300">
								Uses native Popover API with click trigger and preference for
								bottom placement. Click to toggle open/close.
							</p>
						</div>
					}
				>
					<span className="rounded-lg bg-indigo-500 px-4 py-2 text-white transition-colors hover:bg-indigo-600">
						Click Bottom
					</span>
				</NativePopover>
			</div>

			<div className="text-center">
				<h3 className="mb-3 font-semibold">Native Hover Left</h3>
				<NativePopover
					trigger="hover"
					preferredPlacement="left"
					content={
						<div className="overflow-hidden">
							<h4 className="mb-2 font-semibold text-white">
								Hover Trigger - Left
							</h4>
							<p className="text-sm leading-relaxed text-gray-300">
								Hover trigger with left placement preference. Shows native API
								flexibility with different placements.
							</p>
						</div>
					}
				>
					<span className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600">
						Hover Left
					</span>
				</NativePopover>
			</div>
		</div>
	);
}
function CustomPopoverSection(): ReactElement {
	return (
		<section className="rounded-lg border border-white/10 bg-white/5 p-6">
			<h2 className="mb-4 text-2xl font-bold text-purple-300">
				� Native Popover Examples
			</h2>
			<p className="mb-6 text-gray-300">
				Examples of the native Popover API with different trigger modes and
				placement preferences. These use the browser's built-in popover
				functionality with custom positioning logic.
			</p>

			<PopoverDemoGrid />
		</section>
	);
}

function RealityCheckSection(): ReactElement {
	return (
		<section className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6">
			<h2 className="mb-4 text-2xl font-bold text-amber-300">
				🤔 Reality Check: Native vs Custom
			</h2>
			<p className="mb-6 text-gray-300">
				You're absolutely right - that IS a lot of custom code! Here's the
				reality:
			</p>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
					<h4 className="mb-3 font-semibold text-green-300">
						✅ What Native Popover Does Well:
					</h4>
					<ul className="space-y-2 text-sm text-gray-300">
						<li>• Zero JavaScript for basic click/toggle behavior</li>
						<li>• Perfect accessibility (focus, ESC, click-outside)</li>
						<li>• Automatic z-index management (top layer)</li>
						<li>• Light dismiss behavior</li>
						<li>• Works great for simple tooltips and menus</li>
					</ul>
				</div>

				<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
					<h4 className="mb-3 font-semibold text-red-300">
						❌ What It Doesn't Do:
					</h4>
					<ul className="space-y-2 text-sm text-gray-300">
						<li>• Smart positioning (can get cut off at edges)</li>
						<li>• Hover triggers (requires manual JS)</li>
						<li>• Dynamic repositioning on scroll/resize</li>
						<li>
							• Scroll tracking (popovers stay in viewport, not with trigger)
						</li>
						<li>• Complex positioning logic</li>
						<li>• CSS Anchor Positioning is very new (Chrome 125+)</li>
					</ul>
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
				<h4 className="mb-3 font-semibold text-blue-300">
					💡 The Pragmatic Approach:
				</h4>
				<p className="text-sm text-gray-300">
					For most use cases,{" "}
					<strong>stick with native popover + simple CSS positioning</strong>.
					Only build the complex smart positioning when you specifically need
					popovers that work perfectly at screen edges or have complex hover
					behaviors. Libraries like Floating UI, Radix, or HeadlessUI handle
					this complexity better than custom code.
				</p>
			</div>
		</section>
	);
}

function ScrollTestSection(): ReactElement {
	return (
		<section className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-6">
			<h2 className="mb-4 text-2xl font-bold text-orange-300">
				📜 Scroll Behavior Test
			</h2>
			<p className="mb-6 text-gray-300">
				Native popovers use fixed positioning in the "top layer" and don't
				automatically follow their trigger elements when scrolling. Our custom
				implementation adds scroll tracking with smart auto-closing behavior.
			</p>

			<div className="mb-4 space-y-3">
				<p className="text-sm text-gray-400">
					<strong>Enhanced Scroll Behavior:</strong>
				</p>
				<ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
					<li>
						✅ <strong>Follows trigger:</strong> Popover repositions as you
						scroll to stay aligned with its trigger element
					</li>
					<li>
						✅ <strong>Auto-closes when off-screen:</strong> If scrolling takes
						the trigger element completely outside the viewport, the popover
						automatically closes
					</li>
					<li>
						✅ <strong>Responsive to resize:</strong> Handles window resize
						events with the same smart behavior
					</li>
				</ul>
				<p className="mt-4 text-sm text-gray-400">
					<strong>Try this:</strong> Open a popover above, then scroll down past
					it. Notice how the popover automatically closes once its trigger goes
					off-screen, providing a clean UX.
				</p>
			</div>

			{/* Add some content to make the page scrollable */}
			<div className="space-y-4">
				{(() => {
					const SCROLL_BLOCK_COUNT = 10;
					const START_INDEX = 1;
					return Array.from(
						{ length: SCROLL_BLOCK_COUNT },
						(_unusedVal, index) => (
							<div key={index} className="rounded bg-gray-800/50 p-4">
								<h4 className="mb-2 font-semibold text-gray-200">
									Scroll Content Block {index + START_INDEX}
								</h4>
								<p className="text-sm text-gray-400">
									This content makes the page scrollable so you can test popover
									behavior during scroll events. Each block represents
									additional page content that would cause native popovers to
									become disconnected from their trigger elements without proper
									handling.
								</p>
							</div>
						),
					);
				})()}
			</div>
		</section>
	);
}

function BestPracticesSection(): ReactElement {
	return (
		<section className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
			<h3 className="mb-4 text-lg font-semibold text-blue-300">
				💡 Implementation Notes:
			</h3>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				<div>
					<h4 className="mb-2 font-semibold text-blue-200">
						Native Popover API:
					</h4>
					<ul className="list-inside list-disc space-y-1 text-sm text-blue-100">
						<li>Supported in Chrome 114+, Firefox 125+, Safari 17+</li>
						<li>Automatic focus management and accessibility</li>
						<li>Built-in ESC key and outside click handling</li>
						<li>Uses the top layer for z-index management</li>
						<li>Lightweight with no JavaScript required</li>
					</ul>
				</div>
				<div>
					<h4 className="mb-2 font-semibold text-blue-200">
						Smart Positioning:
					</h4>
					<ul className="list-inside list-disc space-y-1 text-sm text-blue-100">
						<li>Automatically detects viewport boundaries</li>
						<li>Flips to best available position when needed</li>
						<li>Calculates space in all four directions</li>
						<li>Prevents popover from being cut off</li>
						<li>Maintains preferred placement when possible</li>
					</ul>
				</div>
				<div>
					<h4 className="mb-2 font-semibold text-blue-200">
						Custom Implementation:
					</h4>
					<ul className="list-inside list-disc space-y-1 text-sm text-blue-100">
						<li>Full control over styling and behavior</li>
						<li>Works in all browsers with polyfills</li>
						<li>Custom positioning and animation support</li>
						<li>Visual arrow indicators</li>
						<li>More code but greater flexibility</li>
					</ul>
				</div>
			</div>
		</section>
	);
}

function PopoverDemoPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					💬 {t("pages.popoverDemo.title", "Modern Popover Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.popoverDemo.subtitle",
						"Explore modern web UI popover implementations including the native Popover API and custom solutions",
					)}
				</p>
			</div>

			<DemoNavigation />

			<div className="space-y-12">
				<NativePopoverSection />
				<RealityCheckSection />
				<CustomPopoverSection />
				<ScrollTestSection />
				<BestPracticesSection />
			</div>
		</div>
	);
}

export default PopoverDemoPage;
