<script>
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import VideoCard from "../components/VideoCard.svelte";
    import VideoPlayer from "../components/VideoPlayer.svelte";

    let videos = [];
    let loading = true;
    let groupedVideos = {}; // { 'YYYY-MM-DD': [videos] }

    onMount(async () => {
        try {
            // Load all videos sorted by date
            const res = await api.fetchVideos("", "date", 1, 1000); // High limit to get most/all for timeline
            videos = res.videos;

            // Group by date
            groupedVideos = videos.reduce((groups, video) => {
                const date = new Date(video.created).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(video);
                return groups;
            }, {});
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });

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
    function handleFocusPlayer(event) {
        activeVideos = activeVideos.map((v) =>
            v.id === event.detail ? { ...v, zIndex: ++topZIndex } : v,
        );
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
            <a href="/" class="text-gray-400 hover:text-white underline"
                >Back to Gallery</a
            >
        </header>

        {#if loading}
            <div class="text-center py-20 text-gray-500">
                Loading timeline...
            </div>
        {:else}
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
                            {#each daysVideos as video}
                                <VideoCard {video} on:play={handlePlay} />
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        {#each activeVideos as video (video.id)}
            <VideoPlayer
                {video}
                zIndex={video.zIndex}
                on:close={() => handleClosePlayer({ detail: video.id })}
                on:focus={() => handleFocusPlayer({ detail: video.id })}
            />
        {/each}
    </div>
</div>
