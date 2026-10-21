<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { videoStore } from "../../../stores/videoStore";
    import { api } from "../../../lib/api";
    import { confirmDialog } from "../../../stores/dialogStore";
    import { toast } from "../../../stores/toastStore";
    import { mobileGridCols } from "../../../stores/uiStore";
    import VideoCard from "../../../components/VideoCard.svelte";
    import VideoPlayer from "../../../components/VideoPlayer.svelte";
    import VideoDetailsModal from "../../../components/VideoDetailsModal.svelte";
    import VideoTrimModal from "../../../components/VideoTrimModal.svelte";
    import { ArrowLeft, Edit2, Trash2, Ban } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let tag = "";
    let isDetailsOpen = false;
    let isTrimOpen = false;
    let isRenameOpen = false;
    let newTagName = "";
    let selectedVideo = null;
    let activeVideos = [];
    let topZIndex = 100;
    let lastPlayedAt = 0;

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
        const now = Date.now();
        if (now - lastPlayedAt < 300) return;
        lastPlayedAt = now;
        const video = event.detail;
        const id = now + Math.random();
        activeVideos = [...activeVideos, { ...video, id, zIndex: ++topZIndex }];
    }

    function handleDetails(event) {
        selectedVideo = event.detail;
        isDetailsOpen = true;
    }

    function handleTrim(event) {
        selectedVideo = event.detail;
        isTrimOpen = true;
        isDetailsOpen = false;
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
    function openRenameModal() {
        newTagName = tag;
        isRenameOpen = true;
    }

    function closeRenameModal() {
        isRenameOpen = false;
        newTagName = "";
    }

    async function handleRename() {
        if (!newTagName || newTagName === tag) {
            closeRenameModal();
            return;
        }
        try {
            await api.renameTag(tag, newTagName);
            toast.success(`Renamed tag to "${newTagName}"`);
            closeRenameModal();
            goto(`${base}/tags/${encodeURIComponent(newTagName)}`);
        } catch (e) {
            toast.error("Failed to rename tag");
        }
    }

    async function handleDelete() {
        const total = $videoStore.pagination?.total ?? "";
        const ok = await confirmDialog(
            `Delete tag "${tag}"? This will remove it from all ${total} videos.`,
            {
                title: "Delete Tag",
                confirmLabel: "Delete",
                destructive: true,
            }
        );
        if (ok) {
            try {
                await api.deleteTag(tag);
                toast.success(`Deleted tag "${tag}"`);
                goto(`${base}/tags`);
            } catch (e) {
                toast.error("Failed to delete tag");
            }
        }
    }

    async function handleBlacklist() {
        const ok = await confirmDialog(
            `Blacklist tag "${tag}"? This will remove it from all videos and prevent it from being auto-generated.`,
            {
                title: "Blacklist Tag",
                confirmLabel: "Blacklist",
                destructive: true,
            }
        );
        if (ok) {
            try {
                await api.blacklistTag(tag);
                toast.success(`Blacklisted tag "${tag}"`);
                goto(`${base}/tags`);
            } catch (e) {
                toast.error("Failed to blacklist tag");
            }
        }
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-3 md:p-6 pb-20">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <div class="flex items-center gap-3 min-w-0 flex-1">
            <a
                href="{base}/tags"
                class="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition shrink-0"
                aria-label="Back to tags"
            >
                <ArrowLeft size={20} class="md:w-6 md:h-6" />
            </a>
            <h1 class="text-xl md:text-3xl font-bold truncate">
                <span class="text-gray-400 font-normal text-sm md:text-xl">Tag:</span>
                <span
                    class="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent"
                    >{tag}</span
                >
            </h1>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
            <button
                on:click={openRenameModal}
                class="px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded flex items-center gap-1.5 md:gap-2 text-sm md:text-base transition"
            >
                <Edit2 size={16} />
                <span>Rename</span>
            </button>
            <button
                on:click={handleBlacklist}
                class="px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 text-yellow-500 rounded flex items-center gap-1.5 md:gap-2 text-sm md:text-base transition"
            >
                <Ban size={16} />
                <span class="hidden sm:inline">Blacklist</span>
            </button>
            <button
                on:click={handleDelete}
                class="px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 text-red-500 rounded flex items-center gap-1.5 md:gap-2 text-sm md:text-base transition"
            >
                <Trash2 size={16} />
                <span class="hidden sm:inline">Delete</span>
            </button>
        </div>
    </header>

    <!-- Stats / Content -->
    <main class="max-w-7xl mx-auto pb-12">
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
            <div class="mb-4 md:mb-6 text-sm md:text-base text-gray-400 flex items-center justify-between">
                <div>
                    Found <span class="text-white font-bold"
                        >{$videoStore.pagination.total}</span
                    > videos
                </div>
            </div>

            <div
                class="grid {$mobileGridCols === 2 ? 'grid-cols-2' : 'grid-cols-1'} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
            >
                {#each $videoStore.videos as video (video.name)}
                    <VideoCard
                        {video}
                        on:play={handlePlay}
                        on:refresh={handleRefresh}
                        on:details={handleDetails}
                        on:trim={handleTrim}
                    />
                {/each}
            </div>
        {/if}
    </main>

    <!-- Rename Modal -->
    {#if isRenameOpen}
        <div
            class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-4"
            transition:fade={{ duration: 200 }}
        >
            <div
                class="bg-gray-800 rounded-t-2xl md:rounded-xl p-5 md:p-6 w-full md:max-w-md border border-gray-700 shadow-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6"
            >
                <h3 class="text-lg md:text-xl font-bold mb-4 text-white">Rename Tag Globally</h3>
                <input
                    type="text"
                    bind:value={newTagName}
                    class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-base text-white focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6"
                    placeholder="New name..."
                    autofocus
                />
                <div class="flex justify-end gap-3">
                    <button
                        on:click={closeRenameModal}
                        class="px-4 py-2.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition"
                        >Cancel</button
                    >
                    <button
                        on:click={handleRename}
                        class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition active:opacity-80"
                        >Save</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <VideoDetailsModal
        bind:isOpen={isDetailsOpen}
        video={selectedVideo}
        on:refresh={handleRefresh}
        on:trim={(e) => handleTrim({ detail: e.detail })}
    />
    <VideoTrimModal
        bind:isOpen={isTrimOpen}
        video={selectedVideo}
        on:refresh={handleRefresh}
    />

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
