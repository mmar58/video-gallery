<script>
    import { onMount } from "svelte";
    import { videoStore } from "../stores/videoStore";
    import VideoCard from "../components/VideoCard.svelte";
    import VideoPlayer from "../components/VideoPlayer.svelte";

    let searchValue = "";
    let sortValue = "name";

    $: {
        videoStore.load(searchValue, sortValue);
    }

    /* Player Management */
    let activeVideos = [];
    let topZIndex = 100;

    function handlePlay(event) {
        const video = event.detail;
        const id = Date.now() + Math.random(); // Ensure unique ID
        activeVideos = [...activeVideos, { ...video, id, zIndex: ++topZIndex }];
    }

    function handleClosePlayer(event) {
        const id = event.detail;
        activeVideos = activeVideos.filter((v) => v.id !== id);
    }

    function handleFocusPlayer(event) {
        const id = event.detail;
        activeVideos = activeVideos.map((v) =>
            v.id === id ? { ...v, zIndex: ++topZIndex } : v,
        );
    }

    function handleRefresh() {
        videoStore.load(searchValue, sortValue);
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <!-- Header & Controls -->
    <header
        class="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 max-w-7xl mx-auto"
    >
        <h1
            class="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent"
        >
            Video Gallery
        </h1>

        <div class="flex gap-4 w-full md:w-auto">
            <input
                type="text"
                placeholder="Search videos..."
                bind:value={searchValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 w-full md:w-64"
            />

            <select
                bind:value={sortValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
            >
                <option value="name">Name (A-Z)</option>
                <option value="likes">Most Liked</option>
                <option value="random">Random</option>
                <option value="date">Newest</option>
            </select>
        </div>
    </header>

    <!-- Video Grid -->
    <main class="max-w-7xl mx-auto pb-20">
        {#if $videoStore.loading}
            <div class="text-center py-20 text-gray-500">Loading...</div>
        {:else if $videoStore.error}
            <div class="text-center py-20 text-red-500">
                {$videoStore.error}
            </div>
        {:else if $videoStore.videos.length === 0}
            <div class="text-center py-20 text-gray-500">No videos found.</div>
        {:else}
            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
                {#each $videoStore.videos as video (video.name)}
                    <VideoCard
                        {video}
                        on:play={handlePlay}
                        on:refresh={handleRefresh}
                    />
                {/each}
            </div>
        {/if}

        <!-- Pagination Controls -->
        {#if $videoStore.maxPage > 1}
            <div class="flex justify-center items-center gap-4 mt-8 pb-8">
                <button
                    class="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                    disabled={$videoStore.page === 1}
                    on:click={() => videoStore.setPage($videoStore.page - 1)}
                >
                    Previous
                </button>

                <span class="text-gray-400">
                    Page <span class="text-white font-medium"
                        >{$videoStore.page}</span
                    >
                    of
                    <span class="text-white font-medium"
                        >{$videoStore.maxPage}</span
                    >
                </span>

                <button
                    class="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                    disabled={$videoStore.page === $videoStore.maxPage}
                    on:click={() => videoStore.setPage($videoStore.page + 1)}
                >
                    Next
                </button>
            </div>
        {/if}
    </main>

    <!-- Active Video Players -->
    {#each activeVideos as video (video.id)}
        <VideoPlayer
            {video}
            zIndex={video.zIndex}
            on:close={() => handleClosePlayer({ detail: video.id })}
            on:focus={() => handleFocusPlayer({ detail: video.id })}
        />
    {/each}
</div>
