import { writable, derived } from "svelte/store";
import { videoStore } from "../stores/videoStore";

export function useMultiSelect() {
    const selectionMode = writable(false);
    const selectedVideoNames = writable<Set<string>>(new Set());

    const selectedVideos = derived(
        [videoStore, selectedVideoNames],
        ([$videoStore, $selectedVideoNames]) => 
            $videoStore.videos.filter(v => $selectedVideoNames.has(v.name))
    );

    const selectedCount = derived(selectedVideoNames, $names => $names.size);
    
    const selectedTotalSize = derived(selectedVideos, $videos => 
        $videos.reduce((sum, v) => sum + (v.size || 0), 0)
    );

    function toggleMode() {
        selectionMode.update(mode => {
            if (mode) selectedVideoNames.set(new Set());
            return !mode;
        });
    }

    function toggleSelectVideo(video: any) {
        selectedVideoNames.update(names => {
            const next = new Set(names);
            if (next.has(video.name)) {
                next.delete(video.name);
            } else {
                next.add(video.name);
            }
            return next;
        });
    }

    function selectAll(videos: any[]) {
        selectedVideoNames.set(new Set(videos.map(v => v.name)));
    }

    function clearSelection() {
        selectedVideoNames.set(new Set());
    }
    
    function reset() {
        selectedVideoNames.set(new Set());
        selectionMode.set(false);
    }

    return {
        selectionMode,
        selectedVideoNames,
        selectedVideos,
        selectedCount,
        selectedTotalSize,
        toggleMode,
        toggleSelectVideo,
        selectAll,
        clearSelection,
        reset
    };
}
