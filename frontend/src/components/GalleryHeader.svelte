<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { SlidersHorizontal, Search, X } from "lucide-svelte";
    import { isMobile } from "../lib/device";

    export let searchValue: string;
    export let sortValue: string;
    export let tagValue: string;
    export let dateFrom: string;
    export let dateTo: string;
    export let tags: string[] = [];
    /** Number of non-default filters, shown as a badge on the phone filter button. */
    export let activeFilters = 0;

    const dispatch = createEventDispatcher();

    function clearDates() {
        dateFrom = "";
        dateTo = "";
    }
</script>

{#if $isMobile}
    <!-- Phone: search + single Filters button (everything else lives in the sheet) -->
    <div class="mx-auto mb-3 flex max-w-7xl items-center gap-2">
        <div class="relative flex-1">
            <Search
                size={18}
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
                type="search"
                placeholder="Search videos..."
                bind:value={searchValue}
                aria-label="Search videos"
                class="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-9 focus:border-red-500 focus:outline-none"
            />
            {#if searchValue}
                <button
                    type="button"
                    class="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-gray-400"
                    aria-label="Clear search"
                    on:click={() => (searchValue = "")}
                >
                    <X size={16} />
                </button>
            {/if}
        </div>
        <button
            type="button"
            class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-200 active:bg-gray-700"
            aria-label="Filters and sort"
            on:click={() => dispatch("openfilters")}
        >
            <SlidersHorizontal size={20} />
            {#if activeFilters > 0}
                <span
                    class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white"
                >
                    {activeFilters}
                </span>
            {/if}
        </button>
    </div>
{:else}
    <header class="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
            Video Gallery
        </h1>

        <div class="flex flex-wrap gap-4 w-full md:w-auto items-center">
            <input
                type="text"
                placeholder="Search videos..."
                bind:value={searchValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 w-full md:w-64"
            />

            <!-- Date Range Picker -->
            <div class="flex items-center gap-2">
                <input
                    type="date"
                    bind:value={dateFrom}
                    class="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm focus:border-red-500 text-white placeholder-gray-500"
                    placeholder="From"
                />
                <span class="text-gray-500">-</span>
                <input
                    type="date"
                    bind:value={dateTo}
                    class="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm focus:border-red-500 text-white placeholder-gray-500"
                    placeholder="To"
                />
                {#if dateFrom || dateTo}
                    <button
                        class="text-xs text-red-500 hover:text-red-400"
                        on:click={clearDates}
                    >Clear</button>
                {/if}
            </div>

            <!-- Tag Filter -->
            <select
                bind:value={tagValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 max-w-[150px]"
            >
                <option value="">All Tags</option>
                {#each tags as tag}
                    <option value={tag}>{tag}</option>
                {/each}
            </select>

            <!-- Sort -->
            <select
                bind:value={sortValue}
                class="bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
            >
                <option value="name">Name (A-Z)</option>
                <option value="likes">Most Liked</option>
                <option value="random">Random</option>
                <option value="date">Newest</option>
            </select>
        </div>
    </header>
{/if}
