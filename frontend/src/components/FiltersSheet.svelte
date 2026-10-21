<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import BottomSheet from "./BottomSheet.svelte";

    export let open = false;
    export let sortValue = "name";
    export let tagValue = "";
    export let dateFrom = "";
    export let dateTo = "";
    export let tags: string[] = [];

    const dispatch = createEventDispatcher();

    $: hasDates = !!(dateFrom || dateTo);

    function resetAll() {
        tagValue = "";
        sortValue = "name";
        dispatch("cleardates");
    }
</script>

<BottomSheet bind:open title="Filters & sort" zIndex={80}>
    <div class="space-y-5 p-4">
        <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Sort by
            </span>
            <select
                bind:value={sortValue}
                class="min-h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-red-500 focus:outline-none"
            >
                <option value="name">Name (A-Z)</option>
                <option value="likes">Most Liked</option>
                <option value="random">Random</option>
                <option value="date">Newest</option>
            </select>
        </label>

        <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tag
            </span>
            <select
                bind:value={tagValue}
                class="min-h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-red-500 focus:outline-none"
            >
                <option value="">All Tags</option>
                {#each tags as tag}
                    <option value={tag}>{tag}</option>
                {/each}
            </select>
        </label>

        <div>
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Date range
            </span>
            <div class="grid grid-cols-2 gap-2">
                <input
                    type="date"
                    bind:value={dateFrom}
                    aria-label="From date"
                    class="min-h-11 w-full min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-red-500 focus:outline-none"
                />
                <input
                    type="date"
                    bind:value={dateTo}
                    aria-label="To date"
                    class="min-h-11 w-full min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 text-base text-white focus:border-red-500 focus:outline-none"
                />
            </div>
        </div>

        <div>
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Quick jump
            </span>
            <div class="flex flex-wrap gap-2">
                <button
                    class="chip"
                    on:click={() => dispatch("quickdays", "15")}>1-15 Days</button
                >
                <button
                    class="chip"
                    on:click={() => dispatch("quickdays", "30")}>1-30 Days</button
                >
                <button class="chip" on:click={() => dispatch("prevmonth")}>Previous Month</button>
                {#if hasDates}
                    <button class="chip text-red-400" on:click={() => dispatch("cleardates")}>
                        Clear Date
                    </button>
                {/if}
            </div>
        </div>
    </div>

    <div slot="footer" class="flex gap-2">
        <button
            class="min-h-11 flex-1 rounded-lg bg-gray-800 text-sm font-medium text-gray-200 transition active:bg-gray-700"
            on:click={resetAll}
        >
            Reset
        </button>
        <button
            class="min-h-11 flex-[2] rounded-lg bg-gradient-to-r from-red-600 to-purple-600 text-sm font-semibold text-white transition active:opacity-80"
            on:click={() => (open = false)}
        >
            Done
        </button>
    </div>
</BottomSheet>

<style>
    .chip {
        min-height: 2.5rem;
        padding: 0 0.9rem;
        border-radius: 0.5rem;
        background: #1f2937;
        font-size: 0.85rem;
        color: #d1d5db;
        transition: background 0.15s;
    }
    .chip:active {
        background: #374151;
    }
</style>
