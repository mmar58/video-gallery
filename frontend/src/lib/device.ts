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

/** Viewport narrower than Tailwind's `md` breakpoint (768px). */
export const isMobile = mediaQuery("(max-width: 767px)");

/** Primary input is a finger (no hover, coarse pointer). */
export const isTouch = mediaQuery("(pointer: coarse)");
