<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { api } from "../lib/api";
    import { socket } from "../lib/socket";
    import { X, Loader2 } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();
    let models = [];
    let selectedModel = "";
    let loading = false;
    let taggingStarted = false;

    async function load() {
        try {
            loading = true;
            const [savedSettings, availableModels] = await Promise.all([
                api.fetchOllamaSettings(),
                api.getModels(),
            ]);

            models = availableModels || [];

            const availableNames = models.map((model) => model.name);
            const savedModel = savedSettings?.tagModel || "";

            if (availableNames.includes(savedModel)) {
                selectedModel = savedModel;
            } else if (models.length > 0) {
                selectedModel = models[0].name;
            } else {
                selectedModel = "";
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(load);

    $: if (isOpen) load();

    function close() {
        isOpen = false;
        dispatch("close");
    }

    function startTagging() {
        if (!selectedModel) return;
        socket.emit("start-tagging", { model: selectedModel });
        taggingStarted = true;
        dispatch("started");
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
        <div
            class="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700 relative"
        >
            <button
                on:click={close}
                class="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
                <X size={20} />
            </button>

            <h2 class="text-2xl font-bold mb-6 text-white">Auto Tag Videos</h2>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2"
                        >Select Ollama Model</label
                    >
                    {#if loading}
                        <div class="flex items-center gap-2 text-gray-400">
                            <Loader2 class="animate-spin" size={16} /> Loading models...
                        </div>
                    {:else if models.length > 0}
                        <select
                            bind:value={selectedModel}
                            class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                        >
                            {#each models as model}
                                <option value={model.name}>{model.name}</option>
                            {/each}
                        </select>
                        <p class="text-xs text-gray-500 mt-2">
                            The saved default comes from Settings, but you can still override it here for this run.
                        </p>
                    {:else}
                        <div class="text-red-400">
                            No models found. ensure Ollama is running.
                        </div>
                    {/if}
                </div>

                <div class="pt-4 flex justify-end gap-3">
                    <button
                        on:click={close}
                        class="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >Cancel</button
                    >
                    <button
                        on:click={startTagging}
                        disabled={loading || !selectedModel}
                        class="px-6 py-2 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Tagging
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
