<script>
    import { onMount, tick } from "svelte";
    import { base } from "$app/paths";
    import { api } from "$lib/api";
    import VideoCard from "../../components/VideoCard.svelte";
    import TimelineVideoCard from "../../components/TimelineVideoCard.svelte";
    import VideoPlayer from "../../components/VideoPlayer.svelte";
    import VideoDetailsModal from "../../components/VideoDetailsModal.svelte";

    let videos = [];
    let groupedVideos = {}; // { 'YYYY-MM-DD': [videos] }
    let page = 1;
    let limit = 50; // Smaller chunks
    let loading = false;
    let hasMore = true;
    let observer;
    let sentinel; // Bind to this element for scroll detection

    // Details Modal State
    let selectedVideo = null;
    let isDetailsOpen = false;

    onMount(async () => {
        loadMore();

        // Intersection Observer for Infinite Scroll
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    loadMore();
                }
            },
            { rootMargin: "400px" },
        );
    });

    $: if (sentinel && observer) {
        observer.observe(sentinel);
    }

    async function loadMore() {
        if (loading || !hasMore) return;
        loading = true;

        try {
            const res = await api.fetchVideos("", "date", page, limit);
            const newVideos = res.videos;

            if (newVideos.length < limit) {
                hasMore = false;
            }

            videos = [...videos, ...newVideos];
            groupVideos();
            page++;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function groupVideos() {
        // Group by date, but keep accumulating
        // Re-reduce the whole list is simplest but might be heavy.
        // Better to just iterate newVideos?
        // For now, re-reducing full list ensures sorting correctness if dates interleave (unlikely with sorted fetch).
        groupedVideos = videos.reduce((groups, video) => {
            const date = new Date(video.created).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(video);
            return groups; // This relies on api returning sorted by date DESC
        }, {});
    }

    /* Player Logic Reuse */
    let activeVideos = [];
    let topZIndex = 100;
    function handlePlay(event) {
        const video = event.detail;
        const id = Date.now() + Math.random();
        activeVideos = [...activeVideos, { ...video, id, zIndex: ++topZIndex }];
    }
    function handleClosePlayer(event) {
        activeVideos = activeVideos.filter((v) => v.id !== event.detail);
    }
    function handleRefresh() {
        // Optional: refresh specific video in list
        videos = [...videos]; // trigger reactivity
    }
    function handleDetails(event) {
        selectedVideo = event.detail;
        isDetailsOpen = true;
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <h1
                class="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent"
            >
                Video Timeline
            </h1>
            <a href="{base}/" class="text-gray-400 hover:text-white underline"
                >Back to Gallery</a
            >
        </header>

        <div
            class="space-y-12 relative border-l-2 border-gray-700 ml-4 pl-8 pb-8"
        >
            {#each Object.entries(groupedVideos) as [date, daysVideos]}
                <div class="relative">
                    <!-- Timeline Dot -->
                    <div
                        class="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-red-500 border-4 border-gray-900"
                    ></div>

                    <h2 class="text-xl font-semibold mb-4 text-gray-300">
                        {date}
                        <span class="text-sm font-normal text-gray-500"
                            >({daysVideos.length} videos)</span
                        >
                    </h2>

                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                        {#each daysVideos as video (video.name)}
                            <TimelineVideoCard
                                {video}
                                on:play={handlePlay}
                                on:refresh={handleRefresh}
                                on:details={handleDetails}
                            />
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Sentinel for Intersection Observer -->
        <div bind:this={sentinel} class="h-20 flex items-center justify-center">
            {#if loading}
                <span class="text-gray-500 animate-pulse">Loading more...</span>
            {:else if !hasMore}
                <span class="text-gray-600">End of timeline</span>
            {/if}
        </div>

        {#each activeVideos as video (video.id)}
            <VideoPlayer
                {video}
                zIndex={video.zIndex}
                on:close={() => handleClosePlayer({ detail: video.id })}
            />
        {/each}

        <VideoDetailsModal
            bind:isOpen={isDetailsOpen}
            video={selectedVideo}
            on:refresh={handleRefresh}
        />
    </div>
</div>
