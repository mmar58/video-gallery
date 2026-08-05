<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let page: number;
    export let maxPage: number;
    export let jumpToPage: number;

    const dispatch = createEventDispatcher();

    function handlePageInput(e: KeyboardEvent | FocusEvent) {
        if (e.type === "blur" || (e as KeyboardEvent).key === "Enter") {
            dispatch("setpage", jumpToPage);
        }
    }
</script>

{#if maxPage > 1}
    <div class="flex justify-center items-center gap-4 mt-8 pb-8">
        <button
            class="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            disabled={page === 1}
            on:click={() => dispatch("setpage", page - 1)}
        >
            Previous
        </button>

        <span class="text-gray-400">
            Page <span class="text-white font-medium">{page}</span>
            of
            <span class="text-white font-medium">{maxPage}</span>
        </span>

        <div class="flex items-center gap-2">
            <input
                type="number"
                min="1"
                max={maxPage}
                bind:value={jumpToPage}
                on:keydown={handlePageInput}
                on:blur={handlePageInput}
                class="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-red-500"
            />
            <button
                class="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition text-sm"
                on:click={() => dispatch("setpage", jumpToPage)}
            >
                Go
            </button>
        </div>

        <button
            class="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            disabled={page === maxPage}
            on:click={() => dispatch("setpage", page + 1)}
        >
            Next
        </button>
    </div>
{/if}
