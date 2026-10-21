<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let stats: any;

    const dispatch = createEventDispatcher();

    function handleMonthClick(month: string) {
        // Month is 'YYYY-MM'
        const [y, m] = month.split("-");
        const start = new Date(parseInt(y), parseInt(m) - 1, 1);
        const end = new Date(parseInt(y), parseInt(m), 0);
        
        dispatch("daterange", {
            from: start.toISOString().split("T")[0],
            to: end.toISOString().split("T")[0]
        });
    }
</script>

{#if stats && stats.distributions}
    <div class="max-w-7xl mx-auto mb-3 md:mb-4 space-y-4">
        <!-- Single horizontally scrollable strip on phones, wrapping row on desktop -->
        <div
            class="no-scrollbar -mx-3 flex flex-nowrap items-center gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
            <span class="mr-2 hidden shrink-0 text-sm text-gray-400 md:inline">Overview:</span>
            {#each Object.entries(stats.distributions).sort().reverse().slice(0, 6) as [month, count]}
                <button
                    class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs transition hover:border-blue-500 hover:bg-gray-700 active:bg-gray-700 md:py-1"
                    on:click={() => handleMonthClick(month)}
                >
                    <span class="text-gray-300">
                        {new Date(month + "-02").toLocaleString("default", { month: "short", year: "2-digit" })}
                    </span>
                    <span class="bg-gray-700 text-gray-400 px-1.5 rounded-full text-[10px]">
                        {count}
                    </span>
                </button>
            {/each}
        </div>
    </div>
{/if}
