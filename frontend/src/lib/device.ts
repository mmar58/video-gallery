import { readable, type Readable } from "svelte/store";

/**
 * Creates a readable store that mirrors a CSS media query.
 * The initial value is set synchronously on first subscription, so components
 * render the correct layout on their very first paint (the app is SPA / ssr=false).
 */
function mediaQuery(query: string): Readable<boolean> {
    return readable(false, (set) => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mql = window.matchMedia(query);
        set(mql.matches);
        const handler = (e: MediaQueryListEvent) => set(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    });
}

/**
 * Mobile phone in portrait (width <= 767px),
 * OR mobile phone in landscape (touch device with short height <= 550px, or landscape <= 500px).
 */
export const isMobile = mediaQuery(
    "(max-width: 767px), ((pointer: coarse) and (max-height: 550px)), ((orientation: landscape) and (max-height: 500px))"
);

/** Primary input is a finger (no hover, coarse pointer). */
export const isTouch = mediaQuery("(pointer: coarse)");

