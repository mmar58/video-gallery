<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { api } from "../lib/api";
    import { videoStore } from "../stores/videoStore";
    import { toast } from "../stores/toastStore";
    import { logStore } from "../stores/logStore";
    import {
        X,
        RefreshCw,
        Trash2,
        Tag,
        FileVideo,
        Calendar,
        Image as ImageIcon,
        Film,
        Edit2,
        Plus,
        Ban,
    } from "lucide-svelte";

    export let isOpen = false;
    export let video = null;

    const dispatch = createEventDispatcher();

    let assets = [];
    let loadingAssets = false;
    let newTag = "";

    $: if (isOpen && video) {
        loadAssets();
    }

    function close() {
        isOpen = false;
        dispatch("close");
    }

    async function loadAssets() {
        if (!video) return;
        loadingAssets = true;
        try {
            const res = await api.getAssetDetails(video.name);
            assets = res.assets || [];
        } catch (e) {
            console.error(e);
        } finally {
            loadingAssets = false;
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return "Unknown";
        return new Date(dateStr).toLocaleString();
    }

    function formatSize(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    /* Actions */
    async function regenerateThumbnail() {
        if (!confirm("Regenerate thumbnail?")) return;
        try {
            toast.info("Regenerating thumbnail...");
            await api.generateThumbnail(video.name);
            toast.success("Thumbnail regenerated");
            logStore.add(`Regenerated thumbnail for ${video.name}`, "success");
            loadAssets();
            // Force refresh image in gallery (hacky but effective)
            const imgs = document.querySelectorAll(
                `img[data-vid="${video.name}"]`,
            );
            imgs.forEach(
                (img) =>
                    (img.src =
                        api.getThumbnailUrl(video.name) + "?t=" + Date.now()),
            );
        } catch (e) {
            toast.error("Failed to regenerate thumbnail");
        }
    }

    async function regeneratePreview() {
        if (!confirm("Regenerate animated preview?")) return;
        try {
            toast.info("Regenerating preview...");
            await api.generatePreview(video.name);
            toast.success("Preview regenerated");
            logStore.add(`Regenerated preview for ${video.name}`, "success");
            loadAssets();
        } catch (e) {
            toast.error("Failed to regenerate preview");
        }
    }

    async function handleAddTag() {
        if (!newTag.trim()) return;
        try {
            await videoStore.addTag(video.name, newTag.trim());
            toast.success("Tag added");
            newTag = "";
            dispatch("refresh"); // Tell parent to reload if needed
        } catch (e) {
            toast.error("Failed to add tag");
        }
    }

    async function removeTag(tag) {
        if (!confirm(`Remove tag "${tag}"?`)) return;
        try {
            await videoStore.removeTag(video.name, tag);
            toast.success("Tag removed");
            dispatch("refresh");
        } catch (e) {
            toast.error("Failed to remove tag");
        }
    }

    async function handleRename() {
        const newName = prompt("Rename video:", video.name);
        if (newName && newName !== video.name) {
            try {
                await videoStore.rename(video.name, newName);
                toast.success("Video renamed");
                close();
            } catch (e) {
                toast.error("Failed to rename video");
            }
        }
    }

    async function handleDelete() {
        if (
            confirm(
                `DELETE "${video.name}" permanently? This cannot be undone.`,
            )
        ) {
            try {
                await videoStore.remove(video.name);
                toast.success("Video deleted");
                close();
            } catch (e) {
                toast.error("Failed to delete video");
            }
        }
    }

    // Determine asset stats
    $: thumbnailAsset = assets.find((a) => a.name === "thumbnail.jpg");
    $: previewAsset = assets.find((a) => a.name === "preview.jpg");
    $: generatedThumbnailsRequest = assets.filter(
        (a) => a.name.startsWith("thumbnail_") && a.name.endsWith(".jpg"),
    );
    $: totalGeneratedSize = assets.reduce((acc, curr) => acc + curr.size, 0);
</script>

{#if isOpen && video}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        on:click={close}
    >
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
            on:click|stopPropagation
        >
            <!-- Left: Visuals -->
            <div
                class="w-full md:w-1/3 bg-black/40 p-6 border-r border-gray-800 space-y-6"
            >
                <!-- Main Thumbnail -->
                <div>
                    <h4
                        class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                    >
                        Thumbnail
                    </h4>
                    <div
                        class="aspect-video bg-black rounded overflow-hidden border border-gray-800 relative group"
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
                                class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full backdrop-blur flex items-center gap-2 text-xs transition"
                                on:click={regenerateThumbnail}
                            >
                                <RefreshCw size={12} /> Regenerate
                            </button>
                        </div>
                    </div>
                    <div
                        class="mt-2 flex justify-between text-xs text-gray-400"
                    >
                        <span
                            >{thumbnailAsset
                                ? formatSize(thumbnailAsset.size)
                                : "Not generated"}</span
                        >
                    </div>
                </div>

                <!-- Preview Sprite -->
                <div>
                    <h4
                        class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                    >
                        Animated Preview
                    </h4>
                    {#if previewAsset}
                        <div
                            class="aspect-[5/1] bg-gray-800 rounded border border-gray-700 overflow-hidden relative"
                        >
                            <div
                                class="absolute inset-0 bg-no-repeat bg-cover"
                                style="background-image: url('{api.getPreviewUrl(
                                    video.name,
                                )}'); background-size: 100% 100%;"
                            ></div>
                        </div>
                        <div
                            class="mt-2 flex justify-between text-xs text-gray-400 items-center"
                        >
                            <span>{formatSize(previewAsset.size)}</span>
                            <button
                                class="text-blue-400 hover:text-blue-300"
                                on:click={regeneratePreview}>Regenerate</button
                            >
                        </div>
                    {:else}
                        <div class="p-4 bg-gray-800/50 rounded text-center">
                            <p class="text-xs text-gray-500 mb-2">
                                No preview generated
                            </p>
                            <button
                                class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs transition"
                                on:click={regeneratePreview}
                            >
                                Generate Preview
                            </button>
                        </div>
                    {/if}
                </div>

                <!-- Asset Stats -->
                <div>
                    <h4
                        class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                    >
                        Storage Stats
                    </h4>
                    <ul class="text-xs text-gray-400 space-y-1">
                        <li class="flex justify-between">
                            <span>Video File:</span>
                            <span class="text-gray-200"
                                >{formatSize(video.size)}</span
                            >
                        </li>
                        <li class="flex justify-between">
                            <span>Total Assets:</span>
                            <span class="text-gray-200"
                                >{formatSize(totalGeneratedSize)}</span
                            >
                        </li>
                        <li class="flex justify-between">
                            <span>Asset Count:</span>
                            <span class="text-gray-200"
                                >{assets.length} files</span
                            >
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Right: Metadata & Actions -->
            <div class="flex-1 p-6 flex flex-col">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h2
                            class="text-xl font-bold text-white break-all pr-4 leading-snug"
                        >
                            {video.name}
                        </h2>
                        <p
                            class="text-sm text-gray-400 mt-1 flex items-center gap-2"
                        >
                            <Calendar size={14} />
                            {formatDate(video.created)}
                        </p>
                    </div>
                    <button
                        class="text-gray-500 hover:text-white"
                        on:click={close}
                    >
                        <X size={24} />
                    </button>
                </div>

                <!-- Actions Bar -->
                <div class="flex flex-wrap gap-2 mb-8">
                    <button
                        on:click={handleRename}
                        class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm flex items-center gap-2 transition"
                    >
                        <Edit2 size={14} /> Rename
                    </button>
                    <button
                        on:click={handleDelete}
                        class="px-3 py-1.5 bg-gray-800 hover:bg-red-900/50 text-red-400 rounded text-sm flex items-center gap-2 transition"
                    >
                        <Trash2 size={14} /> Delete Video
                    </button>
                </div>

                <!-- Tags Management -->
                <div class="flex-1">
                    <h4
                        class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"
                    >
                        <Tag size={14} /> Manage Tags
                    </h4>

                    <div class="flex flex-wrap gap-2 mb-4">
                        {#if video.tags && video.tags.length > 0}
                            {#each video.tags as tag}
                                <span
                                    class="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 flex items-center gap-2 group"
                                >
                                    {tag}
                                    <button
                                        class="hover:text-red-400 opacity-50 group-hover:opacity-100 transition"
                                        on:click={() => removeTag(tag)}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            {/each}
                        {:else}
                            <span class="text-gray-500 italic text-sm"
                                >No tags added.</span
                            >
                        {/if}
                    </div>

                    <form
                        on:submit|preventDefault={handleAddTag}
                        class="flex gap-2"
                    >
                        <input
                            type="text"
                            bind:value={newTag}
                            placeholder="Add new tag..."
                            class="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                        />
                        <button
                            type="submit"
                            class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 transition disabled:opacity-50"
                            disabled={!newTag.trim()}
                        >
                            <Plus size={16} /> Add
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
{/if}
