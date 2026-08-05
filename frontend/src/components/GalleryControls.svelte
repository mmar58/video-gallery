<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { base } from "$app/paths";

    export let selectionMode: boolean;

    const dispatch = createEventDispatcher();
</script>

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
    <div class="flex gap-3">
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
