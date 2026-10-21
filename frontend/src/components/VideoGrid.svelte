<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import VideoCard from "./VideoCard.svelte";
    import { isMobile } from "../lib/device";
    import { mobileGridCols } from "../stores/uiStore";

    export let videos: any[] = [];
    export let loading: boolean = false;
    export let error: string | null = null;
    export let selectionMode: boolean = false;
    export let selectedVideoNames: Set<string>;

    const dispatch = createEventDispatcher();

    // Phones: user-selectable 1 (large) or 2 (compact) columns. md+ keeps the original grid.
    $: compact = $isMobile && $mobileGridCols === 2;
</script>

<main class="max-w-7xl mx-auto pb-20">
    <!-- Slot for bulk selection bar -->
    <slot />

    {#if loading}
        <div class="text-center py-20 text-gray-500">Loading...</div>
    {:else if error}
        <div class="text-center py-20 text-red-500">{error}</div>
    {:else if videos.length === 0}
        <div class="text-center py-20 text-gray-500">No videos found.</div>
    {:else}
        <div
            class="grid {$mobileGridCols === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
        >
            {#each videos as video (video.name)}
                <div class="min-w-0 max-md:[content-visibility:auto] max-md:[contain-intrinsic-size:auto_320px]">
                    <VideoCard
                        {video}
                        {selectionMode}
                        {compact}
                        allowLongPress={true}
                        isSelected={selectedVideoNames.has(video.name)}
                        on:play={() => selectionMode ? dispatch("select", video) : dispatch("play", video)}
                        on:select={(e) => dispatch("select", e.detail)}
                        on:longpress={(e) => dispatch("longpress", e.detail)}
                        on:refresh={() => dispatch("refresh")}
                        on:details={(e) => dispatch("details", e.detail)}
                        on:trim={(e) => dispatch("trim", e.detail)}
                    />
                </div>
            {/each}
        </div>
    {/if}
</main>
