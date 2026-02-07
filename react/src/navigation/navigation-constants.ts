// UI / page constants
export const SCROLL_THRESHOLD = 50;
// Hysteresis margin to prevent feedback loop when header size changes affect scroll position
// Set to 70% of threshold to handle header height changes (~54px) plus browser scroll adjustments
// This creates a 15-50px dead zone where state won't flip
export const SCROLL_HYSTERESIS = 35;
