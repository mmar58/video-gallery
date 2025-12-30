<script>
    import { onMount } from "svelte";
    import { api } from "../lib/api";
    import { X, Plus, Trash2, Ban } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";

    export let isOpen = false;

    let blacklist = [];
    let newWord = "";
    let loading = false;

    async function load() {
        try {
            blacklist = await api.fetchBlacklist();
        } catch (e) {
            console.error(e);
        }
    }

    onMount(load);

    $: if (isOpen) load();

    async function add() {
        if (!newWord.trim()) return;
        loading = true;
        try {
            blacklist = await api.addBlacklistWord(newWord);
            newWord = "";
        } catch (e) {
            console.error(e);
        }
        loading = false;
    }

    async function remove(word) {
        try {
            blacklist = await api.removeBlacklistWord(word);
        } catch (e) {
            console.error(e);
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
            transition:fly={{ y: 20 }}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-800"
            >
                <div class="flex items-center gap-2 text-red-400">
                    <Ban size={20} />
                    <h2 class="text-lg font-semibold text-white">
                        Tag Blacklist
                    </h2>
                </div>
                <button
                    on:click={() => (isOpen = false)}
                    class="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                <p class="text-sm text-gray-400">
                    Words listed here will generally be ignored during
                    auto-tagging.
                </p>

                <!-- Add Form -->
                <form on:submit|preventDefault={add} class="flex gap-2">
                    <input
                        type="text"
                        bind:value={newWord}
                        placeholder="Add word to ignore..."
                        class="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                        type="submit"
                        disabled={!newWord.trim() || loading}
                        class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded flex items-center justify-center transition"
                    >
                        <Plus size={20} />
                    </button>
                </form>

                <!-- List -->
                <div
                    class="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700"
                >
                    {#if blacklist.length === 0}
                        <div class="text-center py-8 text-gray-600 italic">
                            No blacklisted words.
                        </div>
                    {/if}
                    {#each blacklist as word}
                        <div
                            class="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded border border-gray-800"
                        >
                            <span class="text-gray-300">{word}</span>
                            <button
                                on:click={() => remove(word)}
                                class="text-gray-500 hover:text-red-400 transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="p-4 border-t border-gray-800 flex justify-end">
                <button
                    on:click={() => (isOpen = false)}
                    class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition"
                    >Close</button
                >
            </div>
        </div>
    </div>
{/if}
