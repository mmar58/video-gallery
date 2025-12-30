<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { socket } from "../lib/socket"; // Use same socket import as AutoTagModal for consistency
    import { X, Image as ImageIcon } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    // Options
    let forceRegenerate = false;
    let generatePreviews = true;

    function close() {
        isOpen = false;
        dispatch("close");
    }

    function startGeneration() {
        socket.emit("start-thumbnails", {
            force: forceRegenerate,
            previews: generatePreviews,
        });
        dispatch("started");
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700 relative"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <button
                on:click={close}
                class="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
                <X size={20} />
            </button>

            <div class="flex items-center gap-3 mb-6">
                <div class="p-2 bg-orange-500/10 rounded-lg">
                    <ImageIcon class="text-orange-500" size={24} />
                </div>
                <h2 class="text-2xl font-bold text-white">Auto Thumbnails</h2>
            </div>

            <div class="space-y-6">
                <div class="space-y-4">
                    <label
                        class="flex items-center gap-3 cursor-pointer group p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition"
                    >
                        <div class="relative flex items-center">
                            <input
                                type="checkbox"
                                bind:checked={forceRegenerate}
                                class="peer sr-only"
                            />
                            <div
                                class="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-orange-500 transition-colors"
                            ></div>
                            <div
                                class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"
                            ></div>
                        </div>
                        <div>
                            <span
                                class="text-gray-300 group-hover:text-white transition font-medium block"
                                >Force Regenerate All</span
                            >
                            <span class="text-xs text-gray-500"
                                >Overwrite existing thumbnails</span
                            >
                        </div>
                    </label>

                    <label
                        class="flex items-center gap-3 cursor-pointer group p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition"
                    >
                        <div class="relative flex items-center">
                            <input
                                type="checkbox"
                                bind:checked={generatePreviews}
                                class="peer sr-only"
                            />
                            <div
                                class="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-purple-500 transition-colors"
                            ></div>
                            <div
                                class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"
                            ></div>
                        </div>
                        <div>
                            <span
                                class="text-gray-300 group-hover:text-white transition font-medium block"
                                >Create Animated Previews</span
                            >
                            <span class="text-xs text-gray-500"
                                >Generate scrubbable sprite sheets</span
                            >
                        </div>
                    </label>
                </div>

                <div class="pt-2 flex justify-end gap-3">
                    <button
                        on:click={close}
                        class="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >Cancel</button
                    >
                    <button
                        on:click={startGeneration}
                        class="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded font-medium hover:opacity-90 transition shadow-lg shadow-orange-900/20"
                    >
                        Start Generation
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
