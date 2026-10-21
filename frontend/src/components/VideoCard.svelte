<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { api } from "../lib/api";
    import { isTouch, isMobile } from "../lib/device";
    import { videoMenu } from "../stores/uiStore";
    import {
        likeVideo,
        renameVideo,
        addTagToVideo,
        toggleHideVideo,
        deleteVideo,
        generateThumbnail as doGenerateThumbnail,
        generatePreview as doGeneratePreview,
    } from "../lib/videoActions";
    import {
        Play,
        Heart,
        Plus,
        Edit2,
        Trash2,
        Image as ImageIcon,
        Info,
        Scissors,
        EyeOff,
        Eye,
        Clock,
        EllipsisVertical,
    } from "lucide-svelte";
    import { authStore } from "../stores/auth";

    export let video: any; // Ideally define a proper Video interface
    export let hoverMode = "player"; // 'player' | 'preview'
    export let selectionMode = false;
    export let isSelected = false;
    /** Smaller layout used by the 2-column phone grid. */
    export let compact = false;
    /** Long-press (touch) emits `longpress` so the page can enter selection mode. */
    export let allowLongPress = false;

    const dispatch = createEventDispatcher();
    let videoRef: HTMLVideoElement;
    let isHovering = false;
    let isPlaying = false;
    let playTimeout: any;
    let thumbnailError = false;
    let hasInteracted = false; // To lazy load video

    let pauseTimeout: any;

    function timeAgo(dateString: string | null | Date): string {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        const seconds = Math.floor(
            (new Date().getTime() - date.getTime()) / 1000,
        );
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    }

    let viewRecorded = false;
    function recordViewIfNew() {
        if (!viewRecorded) {
            viewRecorded = true;
            api.recordView(video.name)
                .then((res) => {
                    if (res.lastViewTime) {
                        video.lastViewTime = res.lastViewTime;
                    }
                })
                .catch(() => {});
        }
    }

    function handleMouseEnter() {
        // Touch browsers emulate mouseenter on tap; don't start video streaming for that.
        if ($isTouch) return;
        isHovering = true;
        if (pauseTimeout) clearTimeout(pauseTimeout);

        if (hoverMode === "player") {
            hasInteracted = true;
            playTimeout = setTimeout(() => {
                if (videoRef && videoRef.paused) {
                    videoRef.play().catch(() => {});
                    recordViewIfNew();
                }
            }, 200);
        } else if (hoverMode === "preview") {
            if ($authStore.user?.low_bandwidth) return; // Disable automatic sprite loading
            checkPreview();
        }
    }

    function handleMouseLeave() {
        isHovering = false;
        clearTimeout(playTimeout);

        if (videoRef && !videoRef.paused) {
            if ($authStore.user?.low_bandwidth) {
                videoRef.pause();
            } else {
                pauseTimeout = setTimeout(() => {
                    if (videoRef) videoRef.pause();
                }, 8000);
            }
        }
    }

    function handleLike(e: Event) {
        e.stopPropagation();
        likeVideo(video);
    }

    function handleDelete(e: Event) {
        e.stopPropagation();
        deleteVideo(video);
    }

    function handleCheckboxClick(e: Event) {
        e.stopPropagation();
        dispatch("select", video);
    }

    function handleRename(e: Event) {
        e.stopPropagation();
        renameVideo(video);
    }

    function handleAddTag(e: Event) {
        e.stopPropagation();
        addTagToVideo(video, () => dispatch("refresh"));
    }

    /* Touch: open the shared action sheet instead of the hover-only overlay */
    function openMenu(e: Event) {
        e.stopPropagation();
        videoMenu.set({
            video,
            onTrim: () => dispatch("trim", video),
            onDetails: () => dispatch("details", video),
            onRefresh: () => dispatch("refresh"),
        });
    }

    /* Touch: long-press enters multi-select */
    let longPressTimer: any = null;
    let longPressed = false;
    let pressX = 0;
    let pressY = 0;

    function handlePointerDown(e: PointerEvent) {
        if (e.pointerType !== "touch" || !allowLongPress) return;
        longPressed = false;
        pressX = e.clientX;
        pressY = e.clientY;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            longPressed = true;
            navigator.vibrate?.(15);
            dispatch("longpress", video);
            // Safety: never swallow a later unrelated tap.
            setTimeout(() => (longPressed = false), 700);
        }, 500);
    }

    function handlePointerMove(e: PointerEvent) {
        if (longPressTimer && Math.hypot(e.clientX - pressX, e.clientY - pressY) > 10) {
            cancelLongPress();
        }
    }

    function cancelLongPress() {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    function handleContextMenu(e: Event) {
        if ($isTouch && allowLongPress) e.preventDefault();
    }

    function handleCardClick() {
        if (longPressed) {
            longPressed = false;
            return;
        }
        selectionMode ? dispatch("select", video) : dispatch("play", video);
    }

    // Tag Actions
    function handleTagClick(e: Event, tag: string) {
        e.stopPropagation();
        filterByTag(tag);
    }

    function filterByTag(tag: string) {
        goto(`${base}/tags/${encodeURIComponent(tag)}`);
    }

    async function generateThumbnail(e: Event) {
        e.stopPropagation();
        if (await doGenerateThumbnail(video)) thumbnailError = false;
    }

    function handleHide(e: Event) {
        e.stopPropagation();
        toggleHideVideo(video);
    }

    /* Animated Preview Logic */
    let previewLoaded = false;
    let previewBgPosition = "0% 0%";

    function handleMouseMove(e: MouseEvent) {
        // Only run logic if in preview mode OR if we just want the visual but hoverMode dictates interaction
        if ($isTouch || hoverMode !== "preview" || !previewLoaded) return;

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

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

    let triedLoadingPreview = false;
    $: processPreview = hoverMode === "preview" && isHovering && previewLoaded;

    function checkPreview() {
        if (triedLoadingPreview) return;
        triedLoadingPreview = true;
        const img = new Image();
        img.src = api.getPreviewUrl(video.name);
        img.onload = () => {
            previewLoaded = true;
        };
    }

    async function generatePreview(e: Event) {
        e.stopPropagation();
        await doGeneratePreview(video, () => {
            triedLoadingPreview = false;
            checkPreview();
        });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="relative group bg-gray-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform {$isTouch
        ? 'select-none active:scale-[0.98]'
        : 'hover:scale-105'}"
    role="button"
    tabindex="0"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:mousemove={handleMouseMove}
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={cancelLongPress}
    on:pointerleave={cancelLongPress}
    on:pointercancel={cancelLongPress}
    on:contextmenu={handleContextMenu}
    on:click={handleCardClick}
    style="{isSelected
        ? 'outline: 2px solid #ef4444; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(239,68,68,0.15);'
        : ''}{$isTouch ? ' -webkit-touch-callout: none;' : ''}"
>
    <!-- Top Info Bar (Always Visible) -->
    <div
        class="px-3 py-2 bg-gray-800/80 border-b border-gray-700/50 flex flex-col gap-0.5"
    >
        <div
            class="text-[0.65rem] font-medium text-gray-300 flex justify-between gap-2"
        >
            {#if compact}
                <span class="flex items-center gap-1 truncate" title="Created"
                    ><Clock size={10} />{timeAgo(video.created)}</span
                >
                <span class="flex items-center gap-1 truncate" title="Last viewed"
                    ><Eye size={10} />{video.lastViewTime
                        ? timeAgo(video.lastViewTime)
                        : "Never"}</span
                >
            {:else}
                <span>Created: {timeAgo(video.created)}</span>
                <span
                    >Viewed: {video.lastViewTime
                        ? timeAgo(video.lastViewTime)
                        : "Never"}</span
                >
            {/if}
        </div>
        <!-- {#if video.lastViewTime}
            <div class="text-[0.55rem] text-gray-400">
                Last view: {new Date(video.lastViewTime).toLocaleString()}
            </div>
        {/if} -->
    </div>

    <!-- Video Preview / Thumbnail -->
    <div class="aspect-video bg-black relative overflow-hidden">
        <!-- Mode: Preview (Sprite Sheet) -->
        {#if processPreview}
            <div
                class="absolute inset-0 w-full h-full bg-no-repeat"
                style="
                    background-image: url('{api.getPreviewUrl(video.name)}');
                    background-size: 500% 500%;
                    background-position: {previewBgPosition};
                "
            ></div>

            <!-- Mode: Player (Video Element) -->
        {:else if hoverMode === "player"}
            <!-- Always show thumbnail as background/placeholder -->
            <img
                data-vid={video.name}
                src={api.getThumbnailUrl(video.name)}
                alt={video.name}
                loading="lazy"
                class="w-full h-full object-cover absolute inset-0 transition-opacity duration-300 {hasInteracted &&
                !thumbnailError
                    ? 'opacity-0'
                    : 'opacity-100'}"
                on:error={() => (thumbnailError = true)}
            />

            <!-- Video Element: Lazy Inducted on Interaction -->
            {#if hasInteracted || thumbnailError}
                <video
                    bind:this={videoRef}
                    src={api.getStreamUrl(video.name)}
                    class="w-full h-full object-cover transition-opacity duration-300 opacity-100"
                    muted
                    loop
                    playsinline
                    preload="metadata"
                ></video>
            {/if}

            <!-- Fallback/Default Static -->
        {:else}
            <img
                data-vid={video.name}
                src={api.getThumbnailUrl(video.name)}
                alt={video.name}
                loading="lazy"
                class="w-full h-full object-cover"
                on:error={() => (thumbnailError = true)}
            />
        {/if}

        <!-- Play Icon -->
        {#if !isHovering}
            <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 transition-opacity"
            >
                <Play size={compact ? 32 : 48} class="text-white fill-white" />
            </div>
        {/if}

        <!-- Selection Checkbox -->
        {#if selectionMode}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class="absolute z-40 {$isTouch
                    ? 'top-1 left-1 p-2'
                    : 'top-10 left-2'}"
                on:click={handleCheckboxClick}
            >
                <div
                    class="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                    style="
                        background: {isSelected
                        ? '#ef4444'
                        : 'rgba(0,0,0,0.6)'};
                        border: 2px solid {isSelected
                        ? '#ef4444'
                        : 'rgba(255,255,255,0.5)'};
                        backdrop-filter: blur(4px);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    "
                >
                    {#if isSelected}
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                        >
                            <path
                                d="M2 6l3 3 5-5"
                                stroke="white"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Selected Overlay Tint -->
        {#if isSelected}
            <div
                class="absolute inset-0 z-10 pointer-events-none"
                style="background: rgba(239,68,68,0.12);"
            ></div>
        {/if}

        <!-- Actions: touch gets always-visible like + menu; desktop keeps the hover overlay -->
        {#if $isTouch || $isMobile}
            {#if !selectionMode}
                <div class="absolute top-2 right-2 z-40 flex gap-2">
                    <button
                        on:click={handleLike}
                        class="flex items-center justify-center rounded-full bg-black/60 text-white active:bg-red-500/80 {compact
                            ? 'h-9 min-w-9 px-2'
                            : 'h-10 min-w-10 px-2.5'}"
                        aria-label={video.likes > 0 ? `${video.likes} likes` : "Like"}
                    >
                        <Heart
                            size={compact ? 16 : 18}
                            class={video.likes > 0 ? "fill-red-500 text-red-500" : ""}
                        />
                        {#if video.likes > 0}
                            <span class="ml-1 text-xs font-bold">{video.likes}</span>
                        {/if}
                    </button>
                    <button
                        on:click={openMenu}
                        class="flex items-center justify-center rounded-full bg-black/60 text-white active:bg-gray-500/80 {compact
                            ? 'h-9 w-9'
                            : 'h-10 w-10'}"
                        aria-label="More actions"
                    >
                        <EllipsisVertical size={compact ? 16 : 18} />
                    </button>
                </div>
            {/if}
        {:else}
        <div
            class="absolute top-10 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 flex-wrap justify-end max-w-[80%]"
        >
            <button
                on:click={handleLike}
                class="bg-black/60 p-2 rounded-full hover:bg-red-500/80 text-white backdrop-blur-sm transition flex items-center"
                title={video.likes > 0 ? `${video.likes} Likes` : "Like"}
            >
                <Heart
                    size={16}
                    class={video.likes > 0 ? "fill-red-500 text-red-500" : ""}
                />
                {#if video.likes > 0}
                    <span class="text-xs font-bold ml-1">{video.likes}</span>
                {/if}
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
                on:click={(e) => {
                    e.stopPropagation();
                    dispatch("trim", video);
                }}
                class="bg-black/60 p-2 rounded-full hover:bg-yellow-500/80 text-white backdrop-blur-sm transition"
                title="Trim Video"
            >
                <Scissors size={16} />
            </button>
            <button
                on:click={handleHide}
                class="bg-black/60 p-2 rounded-full hover:bg-cyan-500/80 text-white backdrop-blur-sm transition"
                title={video.hideUntil && video.hideUntil > Date.now()
                    ? "Unhide"
                    : "Hide"}
            >
                {#if video.hideUntil && video.hideUntil > Date.now()}
                    <Eye size={16} />
                {:else}
                    <EyeOff size={16} />
                {/if}
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
        {/if}

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
        <div class="mb-2 flex items-baseline justify-between gap-2">
            <h3
                class="text-white text-sm font-medium truncate"
                title={video.name}
            >
                {video.name}
            </h3>
            {#if $isTouch}
                <span class="shrink-0 text-[11px] text-gray-500">
                    {(video.size / 1024 / 1024).toFixed(1)} MB
                </span>
            {/if}
        </div>

        <!-- Tags -->
        {#if video.tags && video.tags.length > 0}
            <div class="flex flex-wrap gap-1.5 relative">
                {#each video.tags as tag}
                    <button
                        class="text-[11px] bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 px-2.5 py-1 md:px-2 md:py-0.5 rounded-full transition cursor-pointer select-none flex items-center gap-1 group/tag"
                        on:click={(e) => handleTagClick(e, tag)}
                    >
                        {tag}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>
