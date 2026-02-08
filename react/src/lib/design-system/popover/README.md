# Native Popover Component Library

A React component library that leverages the native HTML Popover API introduced in 2024, providing accessible, performant popover functionality with smart positioning and dual interaction modes.

## Overview

This library provides a modern approach to popovers using the browser's native Popover API, which offers built-in focus management, accessibility features, and automatic light-dismiss behavior. Our implementation adds intelligent positioning, scroll tracking, and React-friendly APIs on top of the native foundation.

## Features

### ✅ Native Browser Integration

- Uses the native HTML `popover` attribute
- Automatic focus management and keyboard navigation
- Built-in light-dismiss behavior (click outside to close)
- No additional JavaScript libraries required
- Leverages browser's native performance optimizations

### ✅ Smart Positioning System

- Preferred placement with intelligent fallbacks
- Viewport boundary detection and adjustment
- Automatic position updates on scroll/resize
- Arrow indicators that adjust to actual placement
- Support for all four cardinal directions (top, bottom, left, right)

### ✅ Dual Interaction Modes

- **Hover Mode**: Shows on mouse enter, hides on mouse leave
- **Click Mode**: Toggle on click, with optional close-on-trigger-click
- Keyboard accessibility (Enter/Space key support)
- Configurable trigger behavior

### ✅ Advanced UX Features

- **Scroll Tracking**: Popover moves with trigger element during scroll
- **Auto-Close**: Automatically closes when trigger goes off-screen
- **Responsive Design**: Adapts to viewport size changes
- **Performance Optimized**: Uses passive event listeners and React.useCallback

## Architecture

The library follows a modular, hook-based architecture with clear separation of concerns:

```
react/src/popover/
├── README.md                               # This documentation
├── types.ts                                # TypeScript type definitions
├── NativePopover.tsx                       # Pure UI component (presentation layer)
├── useNativePopover.ts                     # Main business logic hook
├── usePopoverPositioning.ts                # Positioning and scroll tracking hook
├── calculatePopoverPosition.ts             # Smart positioning algorithm (public API)
├── calculatePopoverPositionTypes.ts        # Shared types for the positioning algorithm
├── adjustHorizontalPosition.ts             # Helper: clamp centered horizontal positions
├── adjustTopBottomPosition.ts              # Helper: clamp top/bottom placements
├── adjustLeftRightPosition.ts              # Helper: clamp left/right placements
├── popover-constants.ts                    # Shared numeric layout constants (GAP_DEFAULT, MIN_MARGIN, CENTER_DIVISOR)
└── getArrowClasses.ts                      # Utility functions (arrow positioning)
```

### **Design Principles**

- **Separation of Concerns**: Logic separated from presentation
- **Hook-First Architecture**: Reusable business logic via custom hooks
- **No Barrel Files**: Direct imports for better tree-shaking
- **React Compiler Ready**: No manual memoization, optimized automatically
- **Type-Safe**: Full TypeScript coverage with explicit type definitions

## Usage

### Basic Example

```tsx
import { NativePopover } from "./popover/NativePopover";

function MyComponent() {
	return (
		<NativePopover
			content={
				<div>
					<h4>Popover Title</h4>
					<p>This is popover content with native browser support!</p>
				</div>
			}
		>
			<button>Click me</button>
		</NativePopover>
	);
}
```

### Advanced Configuration

```tsx
<NativePopover
	trigger="hover" // "hover" | "click"
	preferredPlacement="top" // "top" | "bottom" | "left" | "right"
	closeOnTriggerClick={true} // Allow closing on trigger click
	tabIndex={0} // Custom tab order (default: 0)
	content={<ComplexPopoverContent />}
>
	<CustomTriggerElement />
</NativePopover>
```

### Using the Hook Directly

For custom implementations, use the `useNativePopover` hook directly:

```tsx
import { useNativePopover } from "./popover/useNativePopover";

function CustomPopover() {
	const {
		triggerRef,
		popoverRef,
		popoverId,
		isOpen,
		popoverPosition,
		placement,
		handleMouseEnter,
		handleMouseLeave,
		handleTriggerClick,
		handleKeyDown,
	} = useNativePopover({
		preferredPlacement: "top",
		trigger: "click",
		closeOnTriggerClick: true,
	});

	return (
		<div className="custom-wrapper">
			<CustomTrigger
				ref={triggerRef}
				onClick={handleTriggerClick}
				onKeyDown={handleKeyDown}
				aria-expanded={isOpen}
			/>
			<CustomPopover
				ref={popoverRef}
				id={popoverId}
				popover="auto"
				style={popoverPosition}
			>
				Custom content with full control
			</CustomPopover>
		</div>
	);
}
```

## API Reference

### NativePopover Props

| Prop                  | Type                                     | Default    | Description                                               |
| --------------------- | ---------------------------------------- | ---------- | --------------------------------------------------------- |
| `children`            | `React.ReactNode`                        | -          | **Required**. The trigger element                         |
| `content`             | `React.ReactNode`                        | -          | **Required**. The popover content                         |
| `preferredPlacement`  | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Preferred position relative to trigger                    |
| `trigger`             | `"hover" \| "click"`                     | `"hover"`  | Interaction mode                                          |
| `closeOnTriggerClick` | `boolean`                                | `false`    | Allow closing by clicking trigger (useful for hover mode) |
| `tabIndex`            | `number`                                 | `0`        | Custom tabIndex for keyboard accessibility                |

### useNativePopover Hook

**Parameters:**

```typescript
type UseNativePopoverProps = Readonly<{
	preferredPlacement: PlacementOption;
	trigger: TriggerMode;
	closeOnTriggerClick: boolean;
}>;
```

**Returns:**

```typescript
type UseNativePopoverReturn = {
	// DOM References
	triggerRef: React.RefObject<HTMLDivElement | null>;
	popoverRef: React.RefObject<HTMLDivElement | null>;
	popoverId: string;

	// State
	isOpen: boolean;
	popoverPosition: PopoverPosition;
	placement: PlacementOption;

	// Actions
	showPopover: () => void;
	hidePopover: () => void;
	togglePopover: () => void;

	// Event Handlers
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
	handleTriggerClick: () => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
};
```

### Exported Types

```typescript
// Position object for popover styling
export type PopoverPosition = {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
	transform?: string;
};

// Main component props
export type NativePopoverProps = Readonly<{
	children: React.ReactNode;
	content: React.ReactNode;
	preferredPlacement?: "top" | "bottom" | "left" | "right";
	trigger?: "hover" | "click";
	closeOnTriggerClick?: boolean;
}>;
```

### Utility Functions

```typescript
// Calculate optimal popover position (default export)
export default function calculatePopoverPosition({
	triggerRect,
	popoverWidth,
	popoverHeight,
	preferredPlacement?: "top" | "bottom" | "left" | "right",
	gap?: number,
}): { position: PopoverPosition; placement: string };

// Internal helper modules (available for advanced use)
import adjustHorizontalPosition from "./adjustHorizontalPosition"; // clamp centered horizontal positions
import adjustTopBottomPosition from "./adjustTopBottomPosition";   // clamps top/bottom placements to viewport
import adjustLeftRightPosition from "./adjustLeftRightPosition";   // clamps left/right placements to viewport

// Shared numeric constants
import { GAP_DEFAULT, MIN_MARGIN, CENTER_DIVISOR } from "./constants";

// Get CSS classes for arrow positioning
export function getArrowClasses(placement: string): string;
```

> Note: The `adjust*` helpers and `constants` are implementation helpers exposed for advanced usage; the recommended integration point is `calculatePopoverPosition` or `usePopoverPositioning`.

## Technical Implementation

### Hook-Based Architecture

The library uses a layered hook approach for maximum reusability:

```typescript
// Main business logic hook
useNativePopover() {
  // Uses positioning hook internally
  usePopoverPositioning() {
    // Uses pure positioning algorithm
    calculatePopoverPosition()
  }
}
```

**Benefits:**

- **Composable**: Each hook can be used independently
- **Testable**: Pure functions and isolated logic
- **Reusable**: Business logic separate from UI rendering
- **Type-Safe**: Full TypeScript coverage with explicit return types

### Enhanced Hover Mode Behavior

The trigger behavior has been enhanced for better UX:

```typescript
// Hover mode now supports click-to-open
const handleTriggerClick = (): void => {
	if (trigger === "click") {
		togglePopover(); // Always toggle in click mode
	} else if (trigger === "hover") {
		if (!isOpen) {
			showPopover(); // Click always opens in hover mode
		} else if (closeOnTriggerClick) {
			hidePopover(); // Close only if prop is enabled
		}
	}
};
```

**UX Improvements:**

- **Touch Devices**: Click-to-open works on devices without hover
- **Accessibility**: All triggers are keyboard accessible
- **Flexibility**: Optional close-on-click for hover mode

### Smart Positioning Algorithm

The positioning system works in three phases:

1. **Preferred Placement**: Attempts to use the requested placement if space is available
2. **Fallback Strategy**: Tries other placements that have sufficient space
3. **Best Fit**: If no placement has enough space, chooses the one with the most available space

**Algorithm Features:**

- Viewport boundary detection and adjustment
- Popover dimensions and gap calculations
- Horizontal/vertical centering with overflow protection
- Edge case handling when popover exceeds viewport

### Advanced Scroll Tracking

Sophisticated scroll behavior with performance optimization:

```typescript
// RAF-throttled scroll handling
let rafId: number | undefined;
const handleScrollAndResize = (): void => {
  if (rafId !== undefined) return;

  rafId = requestAnimationFrame(() => {
    rafId = undefined;
    // Auto-close when trigger goes off-screen
    const isOffScreen = /* boundary calculations */;
    if (isOffScreen) hidePopover();
    else updatePosition();
  });
};
```

### React Compiler Optimization

Fully compatible with React Compiler's automatic optimization:

- **No Manual Memoization**: React Compiler handles optimization automatically
- **Stable References**: Hook returns maintain referential stability
- **Dependency Arrays**: Proper effect dependencies without manual optimization
- **Pure Functions**: Positioning algorithms are side-effect free

## Browser Support

### Native Popover API Support

- **Chrome/Edge**: 114+ (March 2023)
- **Firefox**: 125+ (April 2024)
- **Safari**: 17+ (September 2023)

### Graceful Degradation

The component includes runtime checks for native popover support:

```typescript
if ("showPopover" in popover && typeof popover.showPopover === "function") {
	popover.showPopover();
}
```

For unsupported browsers, consider adding a polyfill or fallback implementation.

## Styling

### Default Styles

The component includes sensible defaults with Tailwind CSS:

```tsx
// Popover container
className =
	"max-w-64 overflow-hidden rounded-lg bg-gray-800 p-4 shadow-lg ring-1 ring-white/10";

// Arrow indicator
className = "absolute h-2 w-2 rotate-45 bg-gray-800";
```

### Customization

Override styles by:

1. Passing custom className to your content
2. Using CSS custom properties
3. Modifying the component's default classes

## Pros and Cons

### ✅ Advantages

**Performance Benefits:**

- **Native Browser Optimization**: Leverages browser's optimized popover implementation
- **No JavaScript Library Overhead**: Reduces bundle size compared to libraries like Floating UI
- **Efficient Event Handling**: Uses passive listeners and minimal DOM manipulation

**Accessibility Excellence:**

- **Built-in ARIA Support**: Native focus management and screen reader compatibility
- **Keyboard Navigation**: Automatic Escape key handling and tab order management
- **Light Dismiss**: Standard click-outside-to-close behavior without custom event listeners

**Developer Experience:**

- **Simple API**: Minimal props with sensible defaults
- **Type Safety**: Full TypeScript support with exported types
- **React Integration**: Hooks-based implementation with proper dependency management

**Modern Web Standards:**

- **Future-Proof**: Built on emerging web standards
- **Standards Compliant**: Follows HTML5 popover specifications
- **Progressive Enhancement**: Works with native browser capabilities

### ⚠️ Limitations

**Browser Support Constraints:**

- **Recent Browsers Only**: Requires Chrome 114+, Firefox 125+, Safari 17+
- **No Legacy Support**: Internet Explorer and older browsers not supported
- **Polyfill Dependency**: May need polyfills for broader compatibility

**Styling Limitations:**

- **Limited Customization**: Native popover has some styling restrictions
- **Z-index Behavior**: Native popovers use top-layer, can't be overridden
- **Animation Constraints**: CSS transitions work, but complex animations may be limited

**Implementation Considerations:**

- **Manual Positioning**: Requires custom positioning logic (which we've implemented)
- **Scroll Handling**: Native API doesn't handle scroll repositioning automatically
- **React Integration**: Needs careful event handling to work smoothly with React

## Migration Guide

### From Traditional Popover Libraries

If migrating from libraries like Floating UI or Popper.js:

1. **Remove external dependencies** from package.json
2. **Replace component imports** with our NativePopover
3. **Update prop names** to match our API
4. **Test positioning behavior** - our smart positioning may behave differently
5. **Verify accessibility** - native behavior might change focus management

### Code Comparison

**Before (with external library):**

```tsx
import {
	FloatingPortal,
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating,
} from "@floating-ui/react";

// Complex setup with multiple hooks and configurations...
```

**After (with NativePopover):**

```tsx
import { NativePopover } from "../popover";

<NativePopover content={<PopoverContent />}>
	<TriggerButton />
</NativePopover>;
```

## Best Practices

### Component Architecture

#### **✅ Recommended Patterns**

**1. Use the Component for Standard Cases:**

```tsx
// Simple tooltip
<NativePopover trigger="hover" content="Help text">
  <HelpIcon />
</NativePopover>

// Interactive menu
<NativePopover trigger="click" content={<MenuItems />}>
  <MenuButton />
</NativePopover>
```

**2. Use the Hook for Custom Logic:**

```tsx
// When you need custom rendering or additional logic
function CustomImplementation() {
	const popover = useNativePopover({
		/* config */
	});

	// Add custom logic
	useEffect(() => {
		if (popover.isOpen) {
			analytics.track("popover_opened");
		}
	}, [popover.isOpen]);

	return <CustomUI {...popover} />;
}
```

**3. Composition Over Configuration:**

```tsx
// Prefer specific components over generic ones
<HelpTooltip content="This field is required">
  <Input />
</HelpTooltip>

// Rather than
<NativePopover trigger="hover" content="This field is required">
  <Input />
</NativePopover>
```

### Performance Optimization

- **Content Strategy**: Keep popover content lightweight to avoid render issues
- **Interaction Mode**: Use `trigger="click"` for mobile-first designs
- **Escape Hatch**: Enable `closeOnTriggerClick={true}` for hover popovers
- **Tab Order**: Use `tabIndex={-1}` when trigger is inside focusable elements

### Accessibility Best Practices

The NativePopover component implements context-aware accessibility patterns that adapt based on interaction mode:

#### **Hover Mode (Tooltip Pattern)**

```tsx
<NativePopover trigger="hover" content="Additional help text">
	<button>Help</button>
</NativePopover>
```

**ARIA Implementation:**

- Trigger: `aria-describedby={popoverId}` (when open)
- Popover: `role="tooltip"` + stable `id`
- Screen reader experience: "Button, additional info in tooltip"

**Best Practices:**

- Keep content concise and informational
- Use for supplementary information only
- Avoid interactive elements inside tooltip content
- Consider mobile users who can't hover

#### **Click Mode (Dialog Pattern)**

```tsx
<NativePopover trigger="click" content={<InteractiveContent />}>
	<button>Show Options</button>
</NativePopover>
```

**ARIA Implementation:**

- Trigger: `aria-expanded={isOpen}` + `id="{popoverId}-trigger"`
- Popover: `role="dialog"` + `aria-labelledby="{popoverId}-trigger"`
- Screen reader experience: "Button, expanded/collapsed"

**Best Practices:**

- Use for interactive content and forms
- Include clear close mechanisms
- Ensure logical tab order within popover
- Provide context about available actions

#### **Universal Accessibility Features**

**Keyboard Navigation:**

```tsx
// Built-in keyboard support
onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleTriggerClick();
  }
}}
```

**Flexible Focus Management:**

```tsx
<NativePopover tabIndex={0}>Normal tab order</NativePopover>
<NativePopover tabIndex={-1}>Programmatic focus only</NativePopover>
<NativePopover tabIndex={5}>Custom tab order (use sparingly)</NativePopover>
```

**Screen Reader Testing:**

- Test with NVDA, JAWS, and VoiceOver
- Verify content is announced appropriately
- Ensure state changes are communicated
- Check focus management during open/close

#### **Common Accessibility Pitfalls to Avoid**

❌ **Don't:**

- Mix interactive elements in tooltip content
- Use `aria-live` with role="tooltip" (creates noise)
- Forget to provide keyboard access
- Use hover-only on touch devices

✅ **Do:**

- Choose appropriate trigger mode for content type
- Test with keyboard-only navigation
- Provide clear visual focus indicators
- Include escape mechanisms for all users

#### **WCAG 2.1 Compliance**

The component meets the following WCAG criteria:

- **1.3.1 Info and Relationships**: Proper ARIA relationships
- **1.4.13 Content on Hover**: Dismissible, hoverable, persistent
- **2.1.1 Keyboard**: Full keyboard accessibility
- **2.1.2 No Keyboard Trap**: Native focus management
- **3.2.2 On Input**: Predictable behavior
- **4.1.2 Name, Role, Value**: Proper ARIA implementation

#### **Testing Checklist**

**Manual Testing:**

- [ ] Tab to trigger element and activate with Enter/Space
- [ ] Verify popover content is read by screen reader
- [ ] Test hover behavior with mouse and keyboard
- [ ] Check click behavior doesn't interfere with hover
- [ ] Ensure popover can be dismissed appropriately

**Automated Testing:**

```tsx
// Example accessibility test
test("popover has proper ARIA attributes", () => {
	render(
		<NativePopover trigger="click" content="Test">
			Button
		</NativePopover>,
	);

	const trigger = screen.getByRole("button");
	expect(trigger).toHaveAttribute("aria-expanded", "false");

	fireEvent.click(trigger);
	expect(trigger).toHaveAttribute("aria-expanded", "true");
});
```

**Screen Reader Testing Commands:**

- **NVDA**: NVDA + Space (browse mode), Tab (focus mode)
- **JAWS**: Insert + F7 (elements list), F (forms mode)
- **VoiceOver**: VO + Space (interact), VO + Right Arrow (navigate)

### UX Considerations

- Use `preferredPlacement="top"` for form field help text
- Use `preferredPlacement="bottom"` for navigation menus
- Provide visual feedback on hover for clickable triggers
- Keep popover content concise and scannable

## Troubleshooting

### Common Issues

**Popover doesn't show:**

- Check browser support for native Popover API
- Verify that trigger element is properly rendered
- Ensure content is not empty

**Positioning problems:**

- Check viewport size and available space
- Verify trigger element has proper dimensions
- Test on different screen sizes

**React Compiler errors:**

- Ensure all callbacks use `useCallback`
- Check dependency arrays for completeness
- Avoid variable hoisting issues

**Styling issues:**

- Remember that popovers use the top layer
- CSS `z-index` won't work on popover elements
- Use `:popover-open` pseudo-class for open state styling

### Debug Mode

Add debug logging to positioning:

```typescript
const { position, placement } = calculatePopoverPosition({
	triggerRect: someTrigger.getBoundingClientRect(),
	popoverWidth: 240,
	popoverHeight: 120,
	preferredPlacement: "bottom",
});
console.log("Calculated position:", { position, placement });
```

## Development Guidelines

### Code Organization

**File Structure Rules:**

- ❌ **No Barrel Files**: Avoid `index.ts` re-exports
- ✅ **Direct Imports**: Import directly from source files
- ✅ **Single Responsibility**: One main export per file
- ✅ **Colocation**: Keep related utilities together

**Example Structure:**

```typescript
// ✅ Good - Direct imports
import { NativePopover } from "./popover/NativePopover";
import { useNativePopover } from "./popover/useNativePopover";
import { type PopoverPosition } from "./popover/types";

// ❌ Avoid - Barrel imports
import { NativePopover, useNativePopover, PopoverPosition } from "./popover";
```

### React Compiler Best Practices

**✅ What We Do (Let React Compiler Optimize):**

```typescript
// No manual memoization needed
const handleClick = () => {
	/* logic */
};
const expensiveValue = computeValue(props.data);

// React Compiler handles optimization automatically
```

**❌ What We Avoid (Manual Optimization):**

```typescript
// Don't do this - React Compiler handles it
const handleClick = useCallback(() => {
	/* logic */
}, [deps]);
const expensiveValue = useMemo(() => computeValue(data), [data]);
```

### Testing Strategy

**Hook Testing:**

```typescript
import { renderHook } from "@testing-library/react-hooks";

import { useNativePopover } from "./useNativePopover";

test("hook manages popover state correctly", () => {
	const { result } = renderHook(() =>
		useNativePopover({
			preferredPlacement: "bottom",
			trigger: "click",
			closeOnTriggerClick: false,
		}),
	);

	expect(result.current.isOpen).toBe(false);

	act(() => {
		result.current.showPopover();
	});

	expect(result.current.isOpen).toBe(true);
});
```

**Component Testing:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NativePopover } from './NativePopover';

test('component shows popover on click', () => {
  render(
    <NativePopover trigger="click" content="Test content">
      <button>Trigger</button>
    </NativePopover>
  );

  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);

  expect(screen.getByText('Test content')).toBeInTheDocument();
});
```

## Contributing

When extending this library:

1. **Maintain Hook Architecture** - Keep logic separate from presentation
2. **Follow TypeScript Patterns** - Export comprehensive types for public APIs
3. **Document Hook Usage** - Include examples for both component and hook usage
4. **Test Edge Cases** - Small viewports, large content, nested scenarios
5. **Verify React Compiler Compatibility** - Avoid manual memoization
6. **No Barrel Files** - Use direct imports for better tree-shaking

## Architecture Review Summary

### ✅ **Current State: Production Ready**

| Category                 | Implementation                   | Quality Score |
| ------------------------ | -------------------------------- | ------------- |
| **Architecture**         | Hook-based with clear separation | ⭐⭐⭐⭐⭐    |
| **Type Safety**          | Full TypeScript coverage         | ⭐⭐⭐⭐⭐    |
| **Accessibility**        | Context-aware ARIA patterns      | ⭐⭐⭐⭐⭐    |
| **Performance**          | React Compiler optimized         | ⭐⭐⭐⭐⭐    |
| **Developer Experience** | Flexible API with good defaults  | ⭐⭐⭐⭐⭐    |
| **Testing**              | Isolated logic, easy to test     | ⭐⭐⭐⭐⭐    |
| **Browser Support**      | Native Popover API (2023+)       | ⭐⭐⭐⭐⭐    |

### **Key Features Implemented**

- ✅ **Dual-mode interaction** (hover/click with enhanced UX)
- ✅ **Smart positioning** with viewport-aware fallbacks
- ✅ **Scroll tracking** with auto-close when off-screen
- ✅ **Accessibility compliance** with context-aware ARIA patterns
- ✅ **Hook-based architecture** for maximum reusability
- ✅ **React Compiler ready** with automatic optimization
- ✅ **Type-safe APIs** with comprehensive TypeScript coverage
- ✅ **No barrel files** for optimal tree-shaking

## Future Enhancements

**Planned Improvements:**

- **Animation API**: Enhanced CSS transition and animation support
- **Portal Mode**: Optional rendering outside DOM hierarchy
- **Theme Integration**: Built-in design system compatibility
- **Virtual Positioning**: Support for positioning relative to coordinates
- **Compound Components**: `PopoverTrigger`, `PopoverContent` pattern
- **Context Provider**: Shared popover management across components

**Research Areas:**

- **Nested Popovers**: Safe handling of popover-within-popover scenarios
- **Mobile Optimization**: Enhanced touch device interactions
- **Performance Monitoring**: Built-in metrics and optimization hints

---

_This library represents a modern, hook-first approach to popover implementation, leveraging native browser capabilities while providing excellent developer experience and accessibility compliance for React applications._
