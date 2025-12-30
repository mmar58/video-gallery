<script>
    import { createEventDispatcher } from "svelte";
    import { goto } from "$app/navigation";
    import { videoStore } from "../stores/videoStore";
    import { api } from "../lib/api";
    import {
        MoreVertical,
        Play,
        Trash2,
        Filter,
        Edit2,
        Ban,
    } from "lucide-svelte";
    import { toast } from "../stores/toastStore";

    export let video;

    const dispatch = createEventDispatcher();
    let isHovering = false;
    let previewLoaded = false;
    let previewBgPosition = "0% 0%";
    let activeTagMenu = null;

    // --- Preview Logic ---
    let triedLoadingPreview = false;
    $: processPreview = isHovering && previewLoaded;

    function handleMouseEnter() {
        isHovering = true;
        if (!triedLoadingPreview) {
            triedLoadingPreview = true;
            const img = new Image();
            img.src = api.getPreviewUrl(video.name);
            img.onload = () => {
                previewLoaded = true;
            };
        }
    }

    function handleMouseLeave() {
        isHovering = false;
        activeTagMenu = null;
    }

    function handleMouseMove(e) {
        if (!processPreview) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // 5x5 grid = 25 frames
        const totalFrames = 25;
        const cols = 5;
        const rows = 5;

        const percent = Math.max(0, Math.min(1, x / width));
        const frameIndex = Math.floor(percent * totalFrames);

        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols);

        const xPos = (col / (cols - 1)) * 100;
        const yPos = (row / (rows - 1)) * 100;

        previewBgPosition = `${xPos}% ${yPos}%`;
    }

    // --- Tag Logic ---
    function handleTagClick(e, tag) {
        e.stopPropagation();
        activeTagMenu = activeTagMenu === tag ? null : tag;
    }

    function filterByTag(tag) {
        goto(`/tags/${encodeURIComponent(tag)}`);
    }

    async function removeTagFromVideo(tag) {
        if (confirm(`Remove tag "${tag}" from this video?`)) {
            try {
                await videoStore.removeTag(video.name, tag);
                activeTagMenu = null;
                dispatch("refresh");
                toast.success(`Removed tag "${tag}"`);
            } catch (e) {
                toast.error("Failed to remove tag");
            }
        }
    }

    async function handleRenameTag(tag) {
        const newName = prompt("Rename tag globally:", tag);
        if (newName && newName !== tag) {
            try {
                await api.renameTag(tag, newName);
                dispatch("refresh");
                activeTagMenu = null;
                toast.success(`Renamed tag to "${newName}"`);
            } catch (e) {
                toast.error("Failed to rename tag");
            }
        }
    }

    async function handleBlacklistTag(tag) {
        if (confirm(`Blacklist "${tag}"? (Removes from all videos + Bans)`)) {
            try {
                await api.blacklistTag(tag);
                dispatch("refresh");
                activeTagMenu = null;
                toast.success(`Blacklisted tag "${tag}"`);
            } catch (e) {
                toast.error("Failed to blacklist tag");
            }
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="relative group bg-gray-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:mousemove={handleMouseMove}
    on:click={() => dispatch("play", video)}
>
    <!-- Aspect Ratio Container -->
    <div class="aspect-video bg-black relative overflow-hidden">
        <!-- Thumbnail (Default) -->
        <img
            src={api.getThumbnailUrl(video.name)}
            alt={video.name}
            class="w-full h-full object-cover absolute inset-0 transition-opacity duration-200"
            class:opacity-0={processPreview}
        />

        <!-- Preview (On Hover) -->
        {#if processPreview}
            <div
                class="absolute inset-0 w-full h-full bg-no-repeat z-10"
                style="
                    background-image: url('{api.getPreviewUrl(video.name)}');
                    background-size: 500% 500%;
                    background-position: {previewBgPosition};
                "
            ></div>
            <!-- Scrub Bar hint -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                    class="h-full bg-red-500/50"
                    style="width: {parseFloat(previewBgPosition) || 0}%"
                ></div>
            </div>
        {/if}

        <!-- Play Icon Overlay (Only when not hovering) -->
        {#if !isHovering}
            <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50"
            >
                <Play size={32} class="text-white fill-white" />
            </div>
        {/if}

        <!-- Duration/Size Badge -->
        <div
            class="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md"
        >
            {(video.size / 1024 / 1024).toFixed(0)}MB
        </div>
    </div>

    <!-- Info Section with Tags -->
    <div class="p-2.5">
        <h3
            class="text-xs text-gray-300 truncate font-medium mb-1.5"
            title={video.name}
        >
            {video.name}
        </h3>

        {#if video.tags && video.tags.length > 0}
            <div class="flex flex-wrap gap-1 relative">
                {#each video.tags as tag}
                    <div class="relative">
                        <button
                            class="text-[10px] bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 px-1.5 py-px rounded-full transition cursor-pointer flex items-center gap-1"
                            on:click={(e) => handleTagClick(e, tag)}
                        >
                            {tag}
                        </button>

                        <!-- Minimal Context Menu for Timeline -->
                        {#if activeTagMenu === tag}
                            <div
                                class="absolute bottom-full left-0 mb-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-xl z-50 overflow-hidden flex flex-col text-xs"
                                on:click|stopPropagation
                            >
                                <button
                                    on:click={() => filterByTag(tag)}
                                    class="px-2 py-1.5 text-left hover:bg-gray-700 flex items-center gap-2 text-gray-200"
                                >
                                    <Filter size={12} /> Filter
                                </button>
                                <button
                                    on:click={() => removeTagFromVideo(tag)}
                                    class="px-2 py-1.5 text-left hover:bg-gray-700 flex items-center gap-2 text-orange-400"
                                >
                                    <Trash2 size={12} /> Remove
                                </button>
                                <button
                                    on:click={() => handleRenameTag(tag)}
                                    class="px-2 py-1.5 text-left hover:bg-gray-700 flex items-center gap-2 text-blue-400"
                                >
                                    <Edit2 size={12} /> Rename
                                </button>
                                <button
                                    on:click={() => handleBlacklistTag(tag)}
                                    class="px-2 py-1.5 text-left hover:bg-gray-700 flex items-center gap-2 text-red-500 border-t border-gray-700"
                                >
                                    <Ban size={12} /> Ban
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
