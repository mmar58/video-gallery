<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { base } from "$app/paths";
    import { Dices, LayoutGrid, Rows3, Wrench, Tag, Image as ImageIcon, SquareCheckBig } from "lucide-svelte";
    import BottomSheet from "./BottomSheet.svelte";
    import { isMobile } from "../lib/device";
    import { mobileGridCols } from "../stores/uiStore";

    export let selectionMode: boolean;

    const dispatch = createEventDispatcher();
    let toolsOpen = false;

    function runTool(event: string) {
        toolsOpen = false;
        dispatch(event);
    }
</script>

{#if $isMobile}
    <!-- Phone: compact toolbar. Navigation lives in the bottom tab bar. -->
    <div class="mx-auto mb-3 flex max-w-7xl items-center gap-2">
        <button
            on:click={() => dispatch("toggleselect")}
            class="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition"
            style={selectionMode
                ? "background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); color: #f87171;"
                : "background: #1f2937; border-color: #374151; color: #d1d5db;"}
        >
            <SquareCheckBig size={18} />
            {selectionMode ? "Exit select" : "Select"}
        </button>
        <button
            on:click={() => dispatch("randomize")}
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-200 active:bg-gray-700"
            aria-label="Randomize videos"
        >
            <Dices size={20} />
        </button>
        <button
            on:click={() => mobileGridCols.update((c) => (c === 1 ? 2 : 1))}
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-200 active:bg-gray-700"
            aria-label={$mobileGridCols === 1 ? "Switch to compact grid" : "Switch to large cards"}
        >
            {#if $mobileGridCols === 1}
                <LayoutGrid size={20} />
            {:else}
                <Rows3 size={20} />
            {/if}
        </button>
        <button
            on:click={() => (toolsOpen = true)}
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-200 active:bg-gray-700"
            aria-label="Tools"
        >
            <Wrench size={20} />
        </button>
    </div>

    <BottomSheet bind:open={toolsOpen} title="Tools" zIndex={80}>
        <ul class="py-1">
            <li>
                <button class="tool-row" on:click={() => runTool("autotag")}>
                    <span class="tool-icon bg-gradient-to-r from-red-600 to-purple-600"><Tag size={18} /></span>
                    <span class="flex flex-col text-left">
                        <span class="font-medium text-white">Auto Tag</span>
                        <span class="text-xs text-gray-400">Tag untagged videos with the AI model</span>
                    </span>
                </button>
            </li>
            <li>
                <button class="tool-row" on:click={() => runTool("autothumb")}>
                    <span class="tool-icon bg-gradient-to-r from-orange-600 to-red-600"><ImageIcon size={18} /></span>
                    <span class="flex flex-col text-left">
                        <span class="font-medium text-white">Auto Thumbs</span>
                        <span class="text-xs text-gray-400">Generate missing thumbnails and previews</span>
                    </span>
                </button>
            </li>
        </ul>
    </BottomSheet>
{:else}
    <div class="max-w-7xl mx-auto mb-8 flex flex-wrap gap-4 items-center justify-between">
        <!-- Quick Date Filters -->
        <div class="flex gap-2 items-center flex-wrap">
            <span class="text-sm text-gray-400 mr-2">Quick Jump:</span>
            <button
                class="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700 transition"
                on:click={() => dispatch("quickdays", "15")}
            >
                1-15 Days
            </button>
            <button
                class="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700 transition"
                on:click={() => dispatch("quickdays", "30")}
            >
                1-30 Days
            </button>
            <button
                class="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700 transition"
                on:click={() => dispatch("prevmonth")}
            >
                Previous Month
            </button>
            <button
                class="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700 transition text-red-400"
                on:click={() => dispatch("cleardates")}
            >
                Clear Date
            </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3">
            <a
                href="{base}/timeline"
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center gap-2 transition"
            >
                Timeline
            </a>
            <a
                href="{base}/upload"
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center gap-2 transition"
            >
                Upload
            </a>
            <a
                href="{base}/tags"
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center gap-2 transition"
            >
                Tags
            </a>
            <button
                on:click={() => dispatch("randomize")}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center gap-2 transition"
                title="Randomize Videos"
            >
                🎲
            </button>
            <button
                on:click={() => dispatch("autotag")}
                class="px-4 py-2 bg-gradient-to-r from-red-600 to-purple-600 hover:opacity-90 text-white rounded flex items-center gap-2 transition font-medium"
            >
                Auto Tag
            </button>
            <button
                on:click={() => dispatch("autothumb")}
                class="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90 text-white rounded flex items-center gap-2 transition font-medium"
            >
                Auto Thumbs
            </button>
            <button
                on:click={() => dispatch("toggleselect")}
                class="px-4 py-2 rounded flex items-center gap-2 transition font-medium text-sm"
                style="{selectionMode
                    ? 'background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.5); color: #f87171;'
                    : 'background: #1f2937; border: 1px solid #374151; color: #d1d5db;'}"
                title="Toggle multi-select mode"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                {selectionMode ? 'Exit Select' : 'Select'}
            </button>
        </div>
    </div>
{/if}

<style>
    .tool-row {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.9rem;
        min-height: 4rem;
        padding: 0.5rem 1.25rem;
        transition: background 0.15s;
    }
    .tool-row:active {
        background: rgba(255, 255, 255, 0.06);
    }
    .tool-icon {
        display: flex;
        height: 2.5rem;
        width: 2.5rem;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        color: white;
    }
</style>
