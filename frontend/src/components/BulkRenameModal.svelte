<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { api } from "../lib/api";
    import { Edit2, X, CheckCircle, XCircle, Film, Loader } from "lucide-svelte";

    export let isOpen = false;
    export let videos: any[] = [];

    const dispatch = createEventDispatcher();

    // Build editable list with new names
    let renameList: { video: any; newName: string; status: 'idle' | 'ok' | 'error'; error: string }[] = [];
    let isRenaming = false;

    // Prefix/suffix mode
    let prefixValue = "";
    let suffixValue = "";
    let replaceFrom = "";
    let replaceTo = "";

    $: if (isOpen && videos.length > 0) {
        renameList = videos.map((v) => ({
            video: v,
            newName: getDisplayName(v),
            status: "idle",
            error: "",
        }));
    }

    function getDisplayName(video: any): string {
        return video.displayName || video.name?.split("::")?.pop() || video.name;
    }

    function applyPattern() {
        renameList = renameList.map((item) => {
            let name = getDisplayName(item.video);
            const ext = name.includes(".") ? "." + name.split(".").pop() : "";
            const base = ext ? name.slice(0, -ext.length) : name;

            let newBase = base;
            if (replaceFrom) {
                newBase = newBase.split(replaceFrom).join(replaceTo);
            }
            if (prefixValue) newBase = prefixValue + newBase;
            if (suffixValue) newBase = newBase + suffixValue;

            return { ...item, newName: newBase + ext };
        });
    }

    function resetNames() {
        renameList = renameList.map((item) => ({
            ...item,
            newName: getDisplayName(item.video),
            status: "idle",
            error: "",
        }));
        prefixValue = "";
        suffixValue = "";
        replaceFrom = "";
        replaceTo = "";
    }

    async function confirmRename() {
        isRenaming = true;

        for (let i = 0; i < renameList.length; i++) {
            const item = renameList[i];
            const originalName = getDisplayName(item.video);
            if (item.newName === originalName) {
                renameList[i] = { ...item, status: "ok" };
                continue;
            }
            try {
                await api.renameVideo(item.video.name, item.newName);
                renameList[i] = { ...item, status: "ok" };
            } catch (err: any) {
                renameList[i] = {
                    ...item,
                    status: "error",
                    error: err.message || "Failed",
                };
            }
            // Trigger reactivity
            renameList = [...renameList];
        }

        isRenaming = false;
        const okCount = renameList.filter((r) => r.status === "ok").length;
        const errCount = renameList.filter((r) => r.status === "error").length;
        dispatch("renamed", { okCount, errCount });

        if (errCount === 0) {
            setTimeout(close, 800);
        }
    }

    function close() {
        if (isRenaming) return;
        isOpen = false;
        dispatch("close");
    }

    function handleBackdropClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains("modal-backdrop")) close();
    }

    $: allDone = renameList.every((r) => r.status === "ok" || r.status === "error");
    $: hasChanges = renameList.some((r) => r.newName !== getDisplayName(r.video));
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
                border: 1px solid rgba(59,130,246,0.3);
                box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1);
            "
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b"
                style="border-color: rgba(59,130,246,0.2); background: rgba(59,130,246,0.08);"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex items-center justify-center w-10 h-10 rounded-full"
                        style="background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4);"
                    >
                        <Edit2 size={20} class="text-blue-400" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white">
                            Bulk Rename
                        </h2>
                        <p class="text-xs text-blue-300/70">
                            {videos.length} video{videos.length !== 1 ? "s" : ""} selected
                        </p>
                    </div>
                </div>
                <button
                    on:click={close}
                    disabled={isRenaming}
                    class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                    <X size={18} />
                </button>
            </div>

            <!-- Pattern Tools -->
            {#if !isRenaming && !allDone}
                <div
                    class="px-6 py-3 border-b space-y-2"
                    style="border-color: rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);"
                >
                    <p class="text-xs font-medium text-gray-400 mb-2">
                        Quick Pattern Tools
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs text-gray-500 w-12">Prefix:</span>
                            <input
                                type="text"
                                bind:value={prefixValue}
                                placeholder="e.g. 2024_"
                                class="bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-28"
                            />
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs text-gray-500 w-12">Suffix:</span>
                            <input
                                type="text"
                                bind:value={suffixValue}
                                placeholder="e.g. _edit"
                                class="bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-28"
                            />
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs text-gray-500 w-12">Replace:</span>
                            <input
                                type="text"
                                bind:value={replaceFrom}
                                placeholder="find"
                                class="bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-20"
                            />
                            <span class="text-xs text-gray-500">→</span>
                            <input
                                type="text"
                                bind:value={replaceTo}
                                placeholder="replace"
                                class="bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-20"
                            />
                        </div>
                        <button
                            on:click={applyPattern}
                            class="px-3 py-1 text-xs rounded text-white font-medium transition"
                            style="background: rgba(59,130,246,0.6);"
                        >
                            Apply
                        </button>
                        <button
                            on:click={resetNames}
                            class="px-3 py-1 text-xs rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Rename List -->
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {#each renameList as item, i}
                    <div
                        class="flex items-center gap-3 p-2.5 rounded-xl transition"
                        style="
                            background: rgba(255,255,255,0.03);
                            border: 1px solid {item.status === 'ok' ? 'rgba(34,197,94,0.3)' : item.status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'};
                        "
                    >
                        <!-- Thumbnail -->
                        <div
                            class="flex-shrink-0 w-14 h-9 rounded overflow-hidden relative"
                            style="background: #0a0a1a; border: 1px solid rgba(255,255,255,0.1);"
                        >
                            <img
                                src={api.getThumbnailUrl(item.video.name)}
                                alt={getDisplayName(item.video)}
                                class="w-full h-full object-cover"
                                on:error={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                            <div class="absolute inset-0 flex items-center justify-center opacity-30">
                                <Film size={14} class="text-gray-500" />
                            </div>
                        </div>

                        <!-- Name Input -->
                        <div class="flex-1 min-w-0">
                            {#if item.status === "idle"}
                                <input
                                    type="text"
                                    bind:value={renameList[i].newName}
                                    class="w-full bg-gray-800/60 border border-gray-700/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                                    disabled={isRenaming}
                                />
                                {#if item.newName !== getDisplayName(item.video)}
                                    <p class="text-[10px] text-gray-500 mt-0.5 truncate">
                                        ← {getDisplayName(item.video)}
                                    </p>
                                {/if}
                            {:else}
                                <p class="text-xs text-white truncate">{item.newName}</p>
                                {#if item.error}
                                    <p class="text-[10px] text-red-400 mt-0.5">{item.error}</p>
                                {/if}
                            {/if}
                        </div>

                        <!-- Status -->
                        <div class="flex-shrink-0 w-5">
                            {#if item.status === "ok"}
                                <CheckCircle size={16} class="text-green-400" />
                            {:else if item.status === "error"}
                                <XCircle size={16} class="text-red-400" />
                            {:else if isRenaming}
                                <div class="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Actions -->
            <div
                class="flex items-center justify-end px-6 py-4 border-t gap-3"
                style="border-color: rgba(255,255,255,0.08); background: rgba(0,0,0,0.3);"
            >
                <button
                    on:click={close}
                    disabled={isRenaming}
                    class="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                >
                    {allDone ? "Close" : "Cancel"}
                </button>
                {#if !allDone}
                    <button
                        on:click={confirmRename}
                        disabled={isRenaming || !hasChanges}
                        class="px-5 py-2 rounded-lg text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                        style="
                            background: linear-gradient(135deg, #2563eb, #1d4ed8);
                            box-shadow: 0 4px 15px rgba(37,99,235,0.4);
                        "
                    >
                        {#if isRenaming}
                            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Renaming...
                        {:else}
                            <Edit2 size={14} />
                            Rename {renameList.filter(r => r.newName !== getDisplayName(r.video)).length || videos.length} File{videos.length !== 1 ? "s" : ""}
                        {/if}
                    </button>
                {/if}
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
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.3);
        border-radius: 4px;
    }
</style>
