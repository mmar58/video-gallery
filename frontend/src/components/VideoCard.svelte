<script>
    import { createEventDispatcher } from "svelte";
    import { goto } from "$app/navigation";
    import { videoStore } from "../stores/videoStore";
    import { api } from "../lib/api";
    import {
        MoreVertical,
        Play,
        Heart,
        Plus,
        Edit2,
        Trash2,
        Ban,
        Filter,
        Image as ImageIcon,
        Info,
    } from "lucide-svelte";

    export let video;

    const dispatch = createEventDispatcher();
    let videoRef;
    let isHovering = false;
    let playTimeout;
    let thumbnailError = false; // Fallback to video if no thumb

    // Tag Menu State
    let activeTagMenu = null; // tagName

    function handleMouseEnter() {
        isHovering = true;
        playTimeout = setTimeout(() => {
            // Only play if we are showing the video element
            if (videoRef && videoRef.paused) {
                videoRef.play().catch(() => {});
            }
        }, 300); // 300ms delay for smoother hover intent
    }

    function handleMouseLeave() {
        isHovering = false;
        activeTagMenu = null; // Close menu on leave
        clearTimeout(playTimeout);
        if (videoRef && !videoRef.paused) {
            videoRef.pause();
        }
    }

    function handleLike(e) {
        e.stopPropagation();
        videoStore.toggleLike(video.name);
    }

    function handleDelete(e) {
        e.stopPropagation();
        if (confirm(`Delete ${video.name}?`)) {
            videoStore.remove(video.name);
        }
    }

    function handleRename(e) {
        e.stopPropagation();
        const newName = prompt("Rename video:", video.name);
        if (newName && newName !== video.name) {
            videoStore.rename(video.name, newName);
        }
    }

    function handleAddTag(e) {
        e.stopPropagation();
        const tag = prompt("Enter new tag:");
        if (tag) {
            videoStore.addTag(video.name, tag).then(() => dispatch("refresh"));
        }
    }

    // Tag Actions
    function handleTagClick(e, tag) {
        e.stopPropagation();
        activeTagMenu = activeTagMenu === tag ? null : tag;
    }

    function filterByTag(tag) {
        goto(`/tags/${encodeURIComponent(tag)}`);
    }

    async function removeTagFromVideo(tag) {
        if (confirm(`Remove tag "${tag}" from this video?`)) {
            await videoStore.removeTag(video.name, tag);
            activeTagMenu = null;
        }
    }

    async function handleRenameTag(tag) {
        const newName = prompt("Rename tag globally:", tag);
        if (newName && newName !== tag) {
            try {
                await api.renameTag(tag, newName);
                dispatch("refresh");
                activeTagMenu = null;
            } catch (e) {
                alert("Failed to rename tag");
            }
        }
    }

    async function handleBlacklistTag(tag) {
        if (confirm(`Blacklist "${tag}"? (Removes from all videos + Bans)`)) {
            try {
                await api.blacklistTag(tag);
                dispatch("refresh");
                activeTagMenu = null;
            } catch (e) {
                alert("Failed to blacklist tag");
            }
        }
    }

    async function generateThumbnail(e) {
        e.stopPropagation();
        try {
            await api.generateThumbnail(video.name);
            // Force reload image logic
            thumbnailError = false;
            const img = document.querySelector(`img[data-vid="${video.name}"]`);
            if (img)
                img.src = api.getThumbnailUrl(video.name) + "?t=" + Date.now();
        } catch (err) {
            alert("Failed to generate thumbnail");
        }
    }

    /* Animated Preview Logic */
    let showPreview = false;
    let previewLoaded = false;
    let previewBgPosition = "0% 0%";

    function handleMouseMove(e) {
        if (!processPreview || !previewLoaded) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Calculate frame index (0 to 24)
        const totalFrames = 25;
        const cols = 5;
        const rows = 5;

        const percent = Math.max(0, Math.min(1, x / width));
        const frameIndex = Math.floor(percent * totalFrames);

        // Calculate grid position
        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols);

        // Convert to percentage for background-position
        // For N items, we use (i / (N-1)) * 100%
        const xPos = (col / (cols - 1)) * 100;
        const yPos = (row / (rows - 1)) * 100;

        previewBgPosition = `${xPos}% ${yPos}%`;
    }

    // Try to load preview image on mount or hover?
    // Let's do lazy load on first hover intent?
    let triedLoadingPreview = false;

    $: processPreview = isHovering && previewLoaded;

    function checkPreview() {
        if (triedLoadingPreview) return;
        triedLoadingPreview = true;

        const img = new Image();
        img.src = api.getPreviewUrl(video.name);
        img.onload = () => {
            previewLoaded = true;
        };
    }

    async function generatePreview(e) {
        e.stopPropagation();
        try {
            await api.generatePreview(video.name);
            triedLoadingPreview = false; // Reset to force reload
            checkPreview();
            alert("Preview generated! Hover to see effect.");
        } catch (err) {
            alert("Failed to generate preview");
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="relative group bg-gray-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105"
    on:mouseenter={(e) => {
        handleMouseEnter();
        checkPreview();
    }}
    on:mouseleave={handleMouseLeave}
    on:mousemove={handleMouseMove}
    on:click={() => dispatch("play", video)}
>
    <!-- Video Preview / Thumbnail -->
    <div class="aspect-video bg-black relative overflow-hidden">
        {#if processPreview}
            <!-- Sprite Sheet Preview -->
            <div
                class="absolute inset-0 w-full h-full bg-no-repeat"
                style="
                    background-image: url('{api.getPreviewUrl(video.name)}');
                    background-size: 500% 500%;
                    background-position: {previewBgPosition};
                "
            ></div>

            <!-- Time indicator (optional) -->
            <!-- <div class="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">Preview</div> -->
        {:else if isHovering || thumbnailError}
            <video
                bind:this={videoRef}
                src={api.getStreamUrl(video.name)}
                class="w-full h-full object-cover"
                muted
                loop
                playsinline
                preload="metadata"
            ></video>
        {:else}
            <img
                data-vid={video.name}
                src={api.getThumbnailUrl(video.name)}
                alt={video.name}
                class="w-full h-full object-cover"
                on:error={() => (thumbnailError = true)}
            />
        {/if}

        <!-- Play Icon -->
        {#if !isHovering}
            <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 transition-opacity"
            >
                <Play size={48} class="text-white fill-white" />
            </div>
        {/if}

        <!-- Actions Overlay -->
        <div
            class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex-wrap justify-end max-w-[80%]"
        >
            <button
                on:click={handleLike}
                class="bg-black/60 p-2 rounded-full hover:bg-red-500/80 text-white backdrop-blur-sm transition"
                title="Like"
            >
                <Heart
                    size={16}
                    class={video.likes > 0 ? "fill-red-500 text-red-500" : ""}
                />
            </button>
            <button
                on:click={handleAddTag}
                class="bg-black/60 p-2 rounded-full hover:bg-green-500/80 text-white backdrop-blur-sm transition"
                title="Add Tag"
            >
                <Plus size={16} />
            </button>
            <!-- Thumbnail Gen -->
            <button
                on:click={generateThumbnail}
                class="bg-black/60 p-2 rounded-full hover:bg-purple-500/80 text-white backdrop-blur-sm transition"
                title="Generate Thumbnail"
            >
                <ImageIcon size={16} />
            </button>
            <!-- Preview Gen -->
            <button
                on:click={generatePreview}
                class="bg-black/60 p-2 rounded-full hover:bg-orange-500/80 text-white backdrop-blur-sm transition"
                title="Generate Animated Preview"
            >
                <ImageIcon size={16} class="text-orange-300" />
            </button>
            <button
                on:click={handleRename}
                class="bg-black/60 p-2 rounded-full hover:bg-blue-500/80 text-white backdrop-blur-sm transition"
                title="Rename Video"
            >
                <Edit2 size={16} />
            </button>
            <button
                on:click={handleDelete}
                class="bg-black/60 p-2 rounded-full hover:bg-red-500/80 text-white backdrop-blur-sm transition"
                title="Delete Video"
            >
                <Trash2 size={16} />
            </button>
            <button
                on:click={(e) => {
                    e.stopPropagation();
                    dispatch("details", video);
                }}
                class="bg-black/60 p-2 rounded-full hover:bg-gray-500/80 text-white backdrop-blur-sm transition"
                title="Video Info"
            >
                <Info size={16} />
            </button>
        </div>

        <!-- Bottom Info Bar (Overlay) -->
        <div
            class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        >
            <div class="flex justify-between items-end text-xs text-gray-300">
                <span>{(video.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
        </div>
    </div>

    <!-- Info -->
    <div class="p-3">
        <h3
            class="text-white text-sm font-medium truncate mb-2"
            title={video.name}
        >
            {video.name}
        </h3>

        <!-- Tags -->
        {#if video.tags && video.tags.length > 0}
            <div class="flex flex-wrap gap-1.5 relative">
                {#each video.tags as tag}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="relative">
                        <button
                            class="text-[11px] bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 px-2 py-0.5 rounded-full transition cursor-pointer select-none flex items-center gap-1 group/tag"
                            on:click={(e) => handleTagClick(e, tag)}
                        >
                            {tag}
                        </button>

                        <!-- Tag Context Menu -->
                        {#if activeTagMenu === tag}
                            <div
                                class="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col text-sm animate-in fade-in slide-in-from-bottom-2 duration-100"
                                on:click|stopPropagation
                            >
                                <button
                                    on:click={() => filterByTag(tag)}
                                    class="px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-gray-200"
                                >
                                    <Filter size={14} /> Filter videos
                                </button>
                                <button
                                    on:click={() => removeTagFromVideo(tag)}
                                    class="px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-orange-400"
                                >
                                    <Trash2 size={14} /> Remove from this video
                                </button>
                                <button
                                    on:click={() => handleRenameTag(tag)}
                                    class="px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-blue-400"
                                >
                                    <Edit2 size={14} /> Rename globally
                                </button>
                                <button
                                    on:click={() => handleBlacklistTag(tag)}
                                    class="px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-red-500 border-t border-gray-700"
                                >
                                    <Ban size={14} /> Blacklist & Ban
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
