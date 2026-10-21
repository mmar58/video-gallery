<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ChevronLeft, ChevronRight } from "lucide-svelte";
    import { isMobile } from "../lib/device";
    import BottomSheet from "./BottomSheet.svelte";

    export let page: number;
    export let maxPage: number;
    export let jumpToPage: number;

    const dispatch = createEventDispatcher();
    let jumpOpen = false;

    function handlePageInput(e: KeyboardEvent | FocusEvent) {
        if (e.type === "blur" || (e as KeyboardEvent).key === "Enter") {
            dispatch("setpage", jumpToPage);
        }
    }

    function submitJump() {
        dispatch("setpage", jumpToPage);
        jumpOpen = false;
    }
</script>

{#if maxPage > 1}
    {#if $isMobile}
        <!-- Phones: compact ‹ Page 3 / 12 › ; tapping the label opens a jump-to-page sheet -->
        <div class="mt-6 flex items-center justify-center gap-3 pb-6">
            <button
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-white transition active:bg-gray-700 disabled:opacity-40"
                disabled={page === 1}
                aria-label="Previous page"
                on:click={() => dispatch("setpage", page - 1)}
            >
                <ChevronLeft size={22} />
            </button>

            <button
                class="h-12 min-w-32 rounded-lg border border-gray-700 bg-gray-800 px-4 text-sm text-gray-400 transition active:bg-gray-700"
                aria-label="Jump to page"
                on:click={() => (jumpOpen = true)}
            >
                Page <span class="font-semibold text-white">{page}</span> /
                <span class="font-semibold text-white">{maxPage}</span>
            </button>

            <button
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-white transition active:bg-gray-700 disabled:opacity-40"
                disabled={page === maxPage}
                aria-label="Next page"
                on:click={() => dispatch("setpage", page + 1)}
            >
                <ChevronRight size={22} />
            </button>
        </div>

        <BottomSheet bind:open={jumpOpen} title="Jump to page" zIndex={80}>
            <form class="flex items-center gap-2 p-4" on:submit|preventDefault={submitJump}>
                <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    max={maxPage}
                    bind:value={jumpToPage}
                    class="h-12 min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 text-center text-white focus:border-red-500 focus:outline-none"
                />
                <span class="text-gray-400">of {maxPage}</span>
                <button
                    type="submit"
                    class="h-12 rounded-lg bg-gradient-to-r from-red-600 to-purple-600 px-5 font-semibold text-white active:opacity-80"
                >
                    Go
                </button>
            </form>
        </BottomSheet>
    {:else}
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
{/if}
