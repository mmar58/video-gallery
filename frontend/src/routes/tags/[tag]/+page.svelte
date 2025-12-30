<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { videoStore } from "../../../stores/videoStore";
    import { api } from "../../../lib/api";
    import VideoCard from "../../../components/VideoCard.svelte";
    import VideoPlayer from "../../../components/VideoPlayer.svelte";
    import VideoDetailsModal from "../../../components/VideoDetailsModal.svelte";
    import { ArrowLeft, Edit2, Trash2, Ban } from "lucide-svelte";

    let tag = "";
    let isDetailsOpen = false;
    let selectedVideo = null;
    let activeVideos = [];
    let topZIndex = 100;

    $: tag = $page.params.tag;

    onMount(async () => {
        if (tag) {
            await videoStore.load("", "name", 1, tag);
        }
    });

    $: if (tag) {
        // Reload when tag changes
        videoStore.load("", "name", 1, tag);
    }

    /* Player Management */
    function handlePlay(event) {
        const video = event.detail;
        const id = Date.now() + Math.random();
        activeVideos = [...activeVideos, { ...video, id, zIndex: ++topZIndex }];
    }

    function handleDetails(event) {
        selectedVideo = event.detail;
        isDetailsOpen = true;
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
        videoStore.load("", "name", 1, tag);
    }

    /* Tag Actions */
    async function handleRename() {
        const newName = prompt("Rename tag globally to:", tag);
        if (newName && newName !== tag) {
            try {
                await api.renameTag(tag, newName);
                goto(`/tags/${encodeURIComponent(newName)}`);
            } catch (e) {
                alert("Failed to rename tag");
            }
        }
    }

    async function handleDelete() {
        if (
            confirm(
                `Delete tag "${tag}"? This will remove it from all ${$videoStore.pagination.total} videos.`,
            )
        ) {
            try {
                await api.deleteTag(tag);
                goto("/tags"); // Go back to tags list
            } catch (e) {
                alert("Failed to delete tag");
            }
        }
    }

    async function handleBlacklist() {
        if (
            confirm(
                `Blacklist tag "${tag}"? This will remove it from all videos and prevent it from being auto-generated.`,
            )
        ) {
            try {
                await api.blacklistTag(tag);
                goto("/tags");
            } catch (e) {
                alert("Failed to blacklist tag");
            }
        }
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-8 flex items-center gap-4">
        <a
            href="/tags"
            class="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
        >
            <ArrowLeft size={24} />
        </a>
        <h1 class="text-3xl font-bold flex-1 truncate">
            <span class="text-gray-400 font-normal">Tag:</span>
            <span
                class="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent"
                >{tag}</span
            >
        </h1>

        <!-- Actions -->
        <div class="flex gap-2">
            <button
                on:click={handleRename}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded flex items-center gap-2 transition"
            >
                <Edit2 size={18} />
                <span class="hidden sm:inline">Rename</span>
            </button>
            <button
                on:click={handleBlacklist}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-red-500 rounded flex items-center gap-2 transition"
            >
                <Ban size={18} />
                <span class="hidden sm:inline">Blacklist</span>
            </button>
            <button
                on:click={handleDelete}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-red-500 rounded flex items-center gap-2 transition"
            >
                <Trash2 size={18} />
                <span class="hidden sm:inline">Delete</span>
            </button>
        </div>
    </header>

    <!-- Stats / Content -->
    <main class="max-w-7xl mx-auto pb-20">
        {#if $videoStore.loading}
            <div class="text-center py-20 text-gray-500">Loading videos...</div>
        {:else if $videoStore.error}
            <div class="text-center py-20 text-red-500">
                {$videoStore.error}
            </div>
        {:else if $videoStore.videos.length === 0}
            <div class="text-center py-20 text-gray-500">
                No videos found with this tag.
            </div>
        {:else}
            <div class="mb-6 text-gray-400">
                Found <span class="text-white font-bold"
                    >{$videoStore.pagination.total}</span
                > videos
            </div>

            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
                {#each $videoStore.videos as video (video.name)}
                    <VideoCard
                        {video}
                        on:play={handlePlay}
                        on:refresh={handleRefresh}
                        on:details={handleDetails}
                    />
                {/each}
            </div>
        {/if}
    </main>

    <VideoDetailsModal bind:isOpen={isDetailsOpen} video={selectedVideo} />

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
