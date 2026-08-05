<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { formatSize } from "../lib/utils";

    export let selectionMode: boolean;
    export let selectedCount: number;
    export let selectedTotalSize: number;

    const dispatch = createEventDispatcher();
</script>

{#if selectionMode}
    <div
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
        style="
            background: linear-gradient(135deg, rgba(15,15,30,0.97) 0%, rgba(20,20,45,0.97) 100%);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1);
            min-width: 400px;
        "
    >
        <!-- Count & Size -->
        <div class="flex flex-col leading-tight mr-2">
            <span class="text-white font-bold text-sm">
                {selectedCount} selected
            </span>
            <span class="text-gray-400 text-xs">
                {formatSize(selectedTotalSize)}
            </span>
        </div>

        <div class="w-px h-8 bg-white/10"></div>

        <!-- Select All / Clear -->
        <button
            on:click={() => dispatch("selectall")}
            class="px-3 py-1.5 text-xs rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
        >
            All
        </button>
        <button
            on:click={() => dispatch("clearnone")}
            class="px-3 py-1.5 text-xs rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
        >
            None
        </button>

        <div class="w-px h-8 bg-white/10"></div>

        <!-- Bulk Rename -->
        <button
            on:click={() => { if (selectedCount > 0) dispatch("rename"); }}
            disabled={selectedCount === 0}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-40"
            style="background: rgba(37,99,235,0.7); color: white;"
            title="Bulk Rename"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Rename
        </button>

        <!-- Bulk Delete -->
        <button
            on:click={() => { if (selectedCount > 0) dispatch("delete"); }}
            disabled={selectedCount === 0}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-40"
            style="background: rgba(220,38,38,0.7); color: white;"
            title="Bulk Delete"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete
        </button>

        <div class="w-px h-8 bg-white/10"></div>

        <!-- Exit Selection -->
        <button
            on:click={() => dispatch("exit")}
            class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Exit selection mode"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    </div>
{/if}
