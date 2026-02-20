import { useEffect, useRef, useState } from "react";

import tw from "@/react/lib/utils/tw";

/**
 * Hook that manages a dismissible alert's closing state, animation class,
 * and calls the provided `onDismiss` callback after the exit animation.
 *
 * @param onDismiss - Callback invoked after the exit animation completes
 * @returns An object containing `isClosing`, `animClass`, `handleDismiss`, and `ANIMATION_DURATION_MS`
 */
export default function useDismissibleAlert(onDismiss: () => void): {
	isClosing: boolean;
	animClass: string;
	handleDismiss: () => void;
	ANIMATION_DURATION_MS: number;
} {
	const [isClosing, setIsClosing] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const ANIMATION_DURATION_MS = 200;

	// Compute animation classes: when visible and not closing -> enter state;
	// when closing -> exit state.
	const animClass = isClosing ? tw`opacity-0 -translate-y-2` : tw`opacity-100 translate-y-0`;

	function handleDismiss(): void {
		if (isClosing) {
			return;
		}

		setIsClosing(true);
		// Match the duration in CSS above. Use a timeout to call onDismiss
		// after the animation completes.
		timeoutRef.current = globalThis.setTimeout(() => {
			try {
				onDismiss();
			} catch (error) {
				// ignore errors from onDismiss to ensure we always reset local state
				console.error("useDismissibleAlert onDismiss error:", error);
			}
			// reset local state in case component remains mounted via props
			setIsClosing(false);
			timeoutRef.current = undefined;
		}, ANIMATION_DURATION_MS);
	}

	// Cleanup the dismissal timeout on unmount to prevent memory leaks or state updates
	useEffect(
		(): (() => void) => () => {
			if (timeoutRef.current !== undefined) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = undefined;
			}
		},
		[],
	);

	return { isClosing, animClass, handleDismiss, ANIMATION_DURATION_MS };
}
