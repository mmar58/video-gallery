import { writable } from "svelte/store";

/** Persisted writable store backed by localStorage (browser only). */
function persisted<T>(key: string, initial: T) {
    let start = initial;
    if (typeof localStorage !== "undefined") {
        try {
            const raw = localStorage.getItem(key);
            if (raw !== null) start = JSON.parse(raw) as T;
        } catch {
            /* ignore corrupt value */
        }
    }
    const store = writable<T>(start);
    store.subscribe((value) => {
        if (typeof localStorage === "undefined") return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* storage full / disabled */
        }
    });
    return store;
}

/** Number of grid columns on phones: 1 = large cards, 2 = compact cards. */
export const mobileGridCols = persisted<1 | 2>("vg-mobile-grid-cols", 1);

/** Context for the shared per-video action sheet (rendered once in the layout). */
export interface VideoMenuState {
    video: any;
    onTrim?: () => void;
    onDetails?: () => void;
    onRefresh?: () => void;
}

export const videoMenu = writable<VideoMenuState | null>(null);

/**
 * Id of the video player currently owning the phone screen. On phones only one
 * player may exist at a time; a newly opened player claims this id and any other
 * player that sees a different id closes itself.
 */
export const mobilePlayerId = writable<number | null>(null);
