<script>
    import { onMount, tick } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { videoStore } from "../stores/videoStore";
    import VideoCard from "../components/VideoCard.svelte";
    import VideoPlayer from "../components/VideoPlayer.svelte";

    let searchValue = "";
    let sortValue = "name";
    let tagValue = "";
    let isMounted = false;

    // Initialize from URL
    onMount(async () => {
        const query = $page.url.searchParams;
        searchValue = query.get("search") || "";
        sortValue = query.get("sort") || "name";
        tagValue = query.get("tag") || "";
        const p = parseInt(query.get("page") || "1");

        // Initial load
        await videoStore.load(searchValue, sortValue, p, tagValue);
        isMounted = true;
    });

    // React to Filter Changes (User Input) -> Load Data
    // We explicitly exclude $videoStore.page from dependencies to avoid loops.
    // When filters change, we reset to page 1.
    $: if (isMounted) {
        // Triggers when searchValue, sortValue, or tagValue changes
        // This is safe because it doesn't depend on store state
        videoStore.load(searchValue, sortValue, 1, tagValue);
    }

    // React to Store Changes -> Sync URL
    // This runs whenever the store updates (which happens after load or setPage)
    $: if (isMounted && $videoStore) {
        const query = new URLSearchParams();
        const s = $videoStore;

        if (s.search) query.set("search", s.search);
        if (s.sort !== "name") query.set("sort", s.sort);
        if (s.selectedTag) query.set("tag", s.selectedTag);
        if (s.page > 1) query.set("page", s.page.toString());

        const queryString = query.toString();
        const url = queryString ? `?${queryString}` : "/";

        if ($page.url.search !== (queryString ? `?${queryString}` : "")) {
            goto(url, { keepFocus: true, replaceState: true, noScroll: true });
        }
    }

    /* Player Management */
    let activeVideos = [];
    let topZIndex = 100;

    function handlePlay(event) {
        const video = event.detail;
        const id = Date.now() + Math.random();
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
        // Reload current state
        videoStore.load(searchValue, sortValue, $videoStore.page, tagValue);
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

        <div class="flex flex-wrap gap-4 w-full md:w-auto items-center">
            <input
                type="text"
                placeholder="Search videos..."
                bind:value={searchValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 w-full md:w-64"
            />

            <!-- Tag Filter -->
            <select
                bind:value={tagValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 max-w-[150px]"
            >
                <option value="">All Tags</option>
                {#each $videoStore.tags as tag}
                    <option value={tag}>{tag}</option>
                {/each}
            </select>

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
