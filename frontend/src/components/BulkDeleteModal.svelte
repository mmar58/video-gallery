<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { api } from "../lib/api";
    import { Trash2, X, AlertTriangle, Film } from "lucide-svelte";

    export let isOpen = false;
    export let videos: any[] = [];

    const dispatch = createEventDispatcher();

    let isDeleting = false;
    let deletedCount = 0;
    let failedCount = 0;

    function formatSize(bytes: number): string {
        if (!bytes) return "Unknown";
        if (bytes >= 1024 * 1024 * 1024)
            return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
        if (bytes >= 1024 * 1024)
            return (bytes / 1024 / 1024).toFixed(1) + " MB";
        return (bytes / 1024).toFixed(0) + " KB";
    }

    function totalSize(): number {
        return videos.reduce((sum, v) => sum + (v.size || 0), 0);
    }

    async function confirmDelete() {
        dispatch("confirm", { videos: [...videos] });
        close();
    }

    function close() {
        if (isDeleting) return;
        isOpen = false;
        dispatch("close");
    }

    function handleBackdropClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
            close();
        }
    }

    function getDisplayName(video: any): string {
        return video.displayName || video.name?.split("::")?.pop() || video.name;
    }

    function getFilePath(video: any): string {
        return video.path || "";
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        on:click={handleBackdropClick}
        style="background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);"
    >
        <div
            class="modal-panel w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 1px solid rgba(239,68,68,0.3);
                box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1);
            "
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b"
                style="border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.08);"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex items-center justify-center w-10 h-10 rounded-full"
                        style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4);"
                    >
                        <AlertTriangle size={20} class="text-red-400" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white">
                            Confirm Bulk Delete
                        </h2>
                        <p class="text-xs text-red-300/70">
                            This action cannot be undone
                        </p>
                    </div>
                </div>
                <button
                    on:click={close}
                    disabled={isDeleting}
                    class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                    <X size={18} />
                </button>
            </div>

            <!-- Summary Bar -->
            <div
                class="px-6 py-3 flex items-center gap-4 text-sm border-b"
                style="border-color: rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);"
            >
                <span class="flex items-center gap-2 text-gray-300">
                    <Film size={14} class="text-red-400" />
                    <strong class="text-white">{videos.length}</strong> video{videos.length !== 1 ? "s" : ""}
                </span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-300">
                    Total size:
                    <strong class="text-orange-400">{formatSize(totalSize())}</strong>
                </span>
            </div>

            <!-- Video List -->
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {#each videos as video, i}
                    <div
                        class="flex items-start gap-3 p-3 rounded-xl transition group"
                        style="
                            background: rgba(255,255,255,0.04);
                            border: 1px solid rgba(255,255,255,0.07);
                        "
                    >
                        <!-- Thumbnail -->
                        <div
                            class="flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden relative"
                            style="background: #0a0a1a; border: 1px solid rgba(255,255,255,0.1);"
                        >
                            <img
                                src={api.getThumbnailUrl(video.name)}
                                alt={getDisplayName(video)}
                                class="w-full h-full object-cover"
                                on:error={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                            <!-- Fallback icon -->
                            <div
                                class="absolute inset-0 flex items-center justify-center opacity-40"
                            >
                                <Film size={20} class="text-gray-500" />
                            </div>
                        </div>

                        <!-- Details -->
                        <div class="flex-1 min-w-0">
                            <p
                                class="text-sm font-medium text-white truncate mb-1"
                                title={getDisplayName(video)}
                            >
                                {i + 1}. {getDisplayName(video)}
                            </p>
                            <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                                <span class="text-orange-400/80 font-medium"
                                    >{formatSize(video.size)}</span
                                >
                                {#if getFilePath(video)}
                                    <span
                                        class="truncate max-w-[320px] opacity-60"
                                        title={getFilePath(video)}
                                    >
                                        {getFilePath(video)}
                                    </span>
                                {/if}
                            </div>
                            {#if video.tags && video.tags.length > 0}
                                <div class="flex flex-wrap gap-1 mt-1">
                                    {#each video.tags.slice(0, 4) as tag}
                                        <span
                                            class="text-[10px] px-1.5 py-0.5 rounded-full"
                                            style="background: rgba(139,92,246,0.2); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2);"
                                            >{tag}</span
                                        >
                                    {/each}
                                    {#if video.tags.length > 4}
                                        <span class="text-[10px] text-gray-500"
                                            >+{video.tags.length - 4} more</span
                                        >
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <!-- Delete indicator -->
                        <div class="flex-shrink-0 mt-1">
                            <Trash2 size={14} class="text-red-400/50 group-hover:text-red-400 transition" />
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Actions -->
            <div
                class="flex items-center justify-between px-6 py-4 border-t gap-3"
                style="border-color: rgba(255,255,255,0.08); background: rgba(0,0,0,0.3);"
            >
                <p class="text-xs text-gray-500 flex-1">
                    Permanently deletes {videos.length} file{videos.length !== 1 ? "s" : ""} from disk.
                </p>
                <div class="flex gap-3">
                    <button
                        on:click={close}
                        disabled={isDeleting}
                        class="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={confirmDelete}
                        disabled={isDeleting}
                        class="px-5 py-2 rounded-lg text-sm font-bold text-white transition disabled:opacity-70 flex items-center gap-2"
                        style="
                            background: linear-gradient(135deg, #dc2626, #b91c1c);
                            box-shadow: 0 4px 15px rgba(220,38,38,0.4);
                        "
                    >
                        {#if isDeleting}
                            <div
                                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            ></div>
                            Deleting...
                        {:else}
                            <Trash2 size={14} />
                            Delete {videos.length} Video{videos.length !== 1 ? "s" : ""}
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-panel {
        animation: slideUp 0.2s ease-out;
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* Custom scrollbar */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(239, 68, 68, 0.3);
        border-radius: 4px;
    }
</style>
