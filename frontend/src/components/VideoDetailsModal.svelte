<script context="module">
    import { FileVideo } from "lucide-svelte";
</script>

<script>
    import { createEventDispatcher } from "svelte";
    import { api } from "../lib/api";
    import { videoStore } from "../stores/videoStore";
    import {
        X,
        RefreshCw,
        Trash2,
        Tag,
        Film,
        Calendar,
        HardDrive,
    } from "lucide-svelte";

    export let isOpen = false;
    export let video = null;

    const dispatch = createEventDispatcher();

    function close() {
        isOpen = false;
        dispatch("close");
    }

    async function regenerateThumbnail() {
        if (!video) return;
        if (confirm("Regenerate thumbnail?")) {
            try {
                await api.generateThumbnail(video.name);
                // Clear cache hack
                const img = document.querySelector(
                    `img[data-vid="${video.name}"]`,
                );
                if (img)
                    img.src =
                        api.getThumbnailUrl(video.name) + "?t=" + Date.now();
                alert("Thumbnail regenerated!");
            } catch (e) {
                alert("Failed to regenerate thumbnail");
            }
        }
    }

    async function deleteThumbnail() {
        // Not exposed in API explicitly but could use the same delete endpoint if we add it,
        // or just rely on video deletion. User asked for "manage generated thumbnails".
        // Let's assume we can regenerate. Deleting solely the thumbnail might cause fallback to video, which is fine.
        // For now, I'll stick to regenerate as the primary "fix" action.
    }

    function formatDate(dateStr) {
        if (!dateStr) return "Unknown";
        return new Date(dateStr).toLocaleString();
    }
</script>

{#if isOpen && video}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        on:click={close}
    >
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            on:click|stopPropagation
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-800"
            >
                <h2
                    class="text-xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent truncate pr-4"
                >
                    {video.name}
                </h2>
                <button
                    class="text-gray-400 hover:text-white transition"
                    on:click={close}
                >
                    <X size={24} />
                </button>
            </div>

            <div class="p-6 space-y-6">
                <!-- Preview Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <span
                            class="text-sm text-gray-400 font-medium uppercase tracking-wider"
                            >Thumbnail Preview</span
                        >
                        <div
                            class="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 relative group"
                        >
                            <img
                                src={api.getThumbnailUrl(video.name)}
                                alt={video.name}
                                class="w-full h-full object-cover"
                            />
                            <div
                                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            >
                                <button
                                    class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur flex items-center gap-2 transition"
                                    on:click={regenerateThumbnail}
                                >
                                    <RefreshCw size={16} /> Regenerate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Metadata Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        class="bg-gray-800/50 p-4 rounded-lg flex items-start gap-4"
                    >
                        <div
                            class="bg-blue-500/10 p-2 rounded-lg text-blue-400"
                        >
                            <FileVideo size={20} />
                        </div>
                        <div>
                            <p
                                class="text-xs text-gray-500 uppercase tracking-wide"
                            >
                                Size
                            </p>
                            <p class="font-medium text-gray-200">
                                {(video.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    <div
                        class="bg-gray-800/50 p-4 rounded-lg flex items-start gap-4"
                    >
                        <div
                            class="bg-green-500/10 p-2 rounded-lg text-green-400"
                        >
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p
                                class="text-xs text-gray-500 uppercase tracking-wide"
                            >
                                Created
                            </p>
                            <p class="font-medium text-gray-200">
                                {formatDate(video.created)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Tags Section -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span
                            class="text-sm text-gray-400 font-medium uppercase tracking-wider"
                            >Tags</span
                        >
                    </div>

                    <div class="flex flex-wrap gap-2">
                        {#if video.tags && video.tags.length > 0}
                            {#each video.tags as tag}
                                <span
                                    class="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 flex items-center gap-2"
                                >
                                    {tag}
                                </span>
                            {/each}
                        {:else}
                            <span class="text-gray-500 italic"
                                >No tags yet. Auto-tag or add some!</span
                            >
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
