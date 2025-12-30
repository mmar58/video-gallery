<script>
    import { createEventDispatcher } from "svelte";
    import { videoStore } from "../stores/videoStore";
    import { api } from "../lib/api";

    export let video;

    const dispatch = createEventDispatcher();
    let videoRef;
    let isHovering = false;
    let playTimeout;

    function handleMouseEnter() {
        isHovering = true;
        // Delay play slightly to avoid flickers
        playTimeout = setTimeout(() => {
            if (videoRef && videoRef.paused) {
                videoRef.play().catch(() => {});
            }
        }, 200);
    }

    function handleMouseLeave() {
        isHovering = false;
        clearTimeout(playTimeout);
        if (videoRef && !videoRef.paused) {
            videoRef.pause();
            // Removed currentTime reset to allow resume
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
        const newName = prompt("New name:", video.name);
        if (newName && newName !== video.name) {
            videoStore.rename(video.name, newName).then(() => {
                dispatch("refresh");
            });
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="relative group bg-gray-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:click={() => dispatch("play", video)}
>
    <!-- Video Preview -->
    <div class="aspect-video bg-black relative">
        <video
            bind:this={videoRef}
            src={api.getStreamUrl(video.name)}
            class="w-full h-full object-cover"
            muted
            loop
            playsinline
        ></video>

        <!-- Play Icon Overlay (hidden when hovering) -->
        <div
            class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-0 transition-opacity"
        >
            <span class="text-4xl text-white">▶</span>
        </div>

        <!-- Actions Overlay (visible on hover) -->
        <div
            class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <button
                on:click={handleLike}
                class="bg-black/50 p-2 rounded-full hover:bg-red-500/80 text-white"
                title="Like"
            >
                ♥ {video.likes || 0}
            </button>
            <button
                on:click={handleRename}
                class="bg-black/50 p-2 rounded-full hover:bg-blue-500/80 text-white"
                title="Rename"
            >
                ✎
            </button>
            <button
                on:click={handleDelete}
                class="bg-black/50 p-2 rounded-full hover:bg-red-500/80 text-white"
                title="Delete"
            >
                🗑
            </button>
        </div>
    </div>

    <!-- Info -->
    <div class="p-3">
        <h3 class="text-white text-sm font-medium truncate" title={video.name}>
            {video.name}
        </h3>
        <!-- Tags placeholder -->
        {#if video.tags && video.tags.length > 0}
            <div class="flex flex-wrap gap-1 mt-1">
                {#each video.tags as tag}
                    <span
                        class="text-[10px] bg-gray-700 text-gray-300 px-1 rounded"
                        >{tag}</span
                    >
                {/each}
            </div>
        {/if}
    </div>
</div>
