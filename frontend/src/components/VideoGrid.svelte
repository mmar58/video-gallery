<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import VideoCard from "./VideoCard.svelte";

    export let videos: any[] = [];
    export let loading: boolean = false;
    export let error: string | null = null;
    export let selectionMode: boolean = false;
    export let selectedVideoNames: Set<string>;

    const dispatch = createEventDispatcher();
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
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each videos as video (video.name)}
                <VideoCard
                    {video}
                    {selectionMode}
                    isSelected={selectedVideoNames.has(video.name)}
                    on:play={() => selectionMode ? dispatch("select", video) : dispatch("play", video)}
                    on:select={(e) => dispatch("select", e.detail)}
                    on:refresh={() => dispatch("refresh")}
                    on:details={(e) => dispatch("details", e.detail)}
                    on:trim={(e) => dispatch("trim", e.detail)}
                />
            {/each}
        </div>
    {/if}
</main>
