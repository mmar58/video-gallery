<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { formatSize } from "../lib/utils";

    export let selectionMode: boolean;
    export let selectedCount: number;
    export let selectedTotalSize: number;

    const dispatch = createEventDispatcher();
</script>

{#if selectionMode}
    <!-- Phones: full-width bar above the bottom tab bar. md+: centered floating pill. -->
    <div
        class="bulk-bar fixed bottom-3 left-2 right-2 z-40 flex items-center justify-between gap-1 rounded-2xl px-3 py-2.5 shadow-2xl md:bottom-6 md:left-1/2 md:right-auto md:min-w-[400px] md:-translate-x-1/2 md:justify-start md:gap-3 md:px-5 md:py-3"
        style="
            background: linear-gradient(135deg, rgba(15,15,30,0.97) 0%, rgba(20,20,45,0.97) 100%);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1);
        "
    >
        <!-- Count & Size -->
        <div class="mr-1 flex flex-col leading-tight md:mr-2">
            <span class="text-white font-bold text-sm whitespace-nowrap">
                {selectedCount} selected
            </span>
            <span class="text-gray-400 text-xs whitespace-nowrap">
                {formatSize(selectedTotalSize)}
            </span>
        </div>

        <div class="hidden h-8 w-px bg-white/10 md:block"></div>

        <!-- Select All / Clear -->
        <button
            on:click={() => dispatch("selectall")}
            class="min-h-10 rounded-lg px-2.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white active:bg-white/10 md:min-h-0 md:px-3 md:py-1.5"
        >
            All
        </button>
        <button
            on:click={() => dispatch("clearnone")}
            class="min-h-10 rounded-lg px-2.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white active:bg-white/10 md:min-h-0 md:px-3 md:py-1.5"
        >
            None
        </button>

        <div class="hidden h-8 w-px bg-white/10 md:block"></div>

        <!-- Bulk Rename -->
        <button
            on:click={() => { if (selectedCount > 0) dispatch("rename"); }}
            disabled={selectedCount === 0}
            class="flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition disabled:opacity-40 md:min-h-0 md:px-4 md:py-1.5"
            style="background: rgba(37,99,235,0.7); color: white;"
            title="Bulk Rename"
            aria-label="Bulk rename"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span class="hidden sm:inline">Rename</span>
        </button>

        <!-- Bulk Delete -->
        <button
            on:click={() => { if (selectedCount > 0) dispatch("delete"); }}
            disabled={selectedCount === 0}
            class="flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition disabled:opacity-40 md:min-h-0 md:px-4 md:py-1.5"
            style="background: rgba(220,38,38,0.7); color: white;"
            title="Bulk Delete"
            aria-label="Bulk delete"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            <span class="hidden sm:inline">Delete</span>
        </button>

        <div class="hidden h-8 w-px bg-white/10 md:block"></div>

        <!-- Exit Selection -->
        <button
            on:click={() => dispatch("exit")}
            class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white active:bg-white/10 md:h-auto md:w-auto md:p-1.5"
            title="Exit selection mode"
            aria-label="Exit selection mode"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    </div>
{/if}
