<script lang="ts">
    export let searchValue: string;
    export let sortValue: string;
    export let tagValue: string;
    export let dateFrom: string;
    export let dateTo: string;
    export let tags: string[] = [];

    function clearDates() {
        dateFrom = "";
        dateTo = "";
    }
</script>

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
