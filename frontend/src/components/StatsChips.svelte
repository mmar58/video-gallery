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
    <div class="max-w-7xl mx-auto mb-4 space-y-4">
        <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm text-gray-400 mr-2">Overview:</span>
            {#each Object.entries(stats.distributions).sort().reverse().slice(0, 6) as [month, count]}
                <button
                    class="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs hover:bg-gray-700 hover:border-blue-500 transition flex items-center gap-2"
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
