import { writable } from "svelte/store";

export interface ActiveVideo {
    id: number;
    zIndex: number;
    [key: string]: any;
}

export function usePlayerManager() {
    const activeVideos = writable<ActiveVideo[]>([]);
    let topZIndex = 100;
    let lastPlayedAt = 0;

    function handlePlay(video: any) {
        const now = Date.now();
        if (now - lastPlayedAt < 300) return; // debounce
        lastPlayedAt = now;
        const id = now + Math.random();
        
        activeVideos.update(videos => [...videos, { ...video, id, zIndex: ++topZIndex }]);
    }

    function handleClosePlayer(id: number) {
        activeVideos.update(videos => videos.filter((v) => v.id !== id));
    }

    function handleFocusPlayer(id: number) {
        activeVideos.update(videos => videos.map((v) =>
            v.id === id ? { ...v, zIndex: ++topZIndex } : v
        ));
    }

    return {
        activeVideos,
        handlePlay,
        handleClosePlayer,
        handleFocusPlayer
    };
}
