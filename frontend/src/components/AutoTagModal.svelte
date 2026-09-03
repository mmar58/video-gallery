<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { api } from "../lib/api";
    import { socket } from "../lib/socket";
    import { X, Loader2 } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();
    let models: any[] = [];
    let selectedModel = "";
    let loading = false;
    
    let resolvingMismatch = false;
    let mismatchData: any = null;
    let serverResolutions: Record<string, { action: string, model: string }> = {};

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

    onMount(() => {
        load();
        socket.on('tagging-model-mismatch', handleMismatch);
        socket.on('tagging-status', handleStatus);
    });

    onDestroy(() => {
        socket.off('tagging-model-mismatch', handleMismatch);
        socket.off('tagging-status', handleStatus);
    });

    $: if (isOpen) {
        load();
        resolvingMismatch = false;
        mismatchData = null;
    }

    function handleMismatch(data: any) {
        if (!isOpen) return;
        mismatchData = data;
        resolvingMismatch = true;
        
        serverResolutions = {};
        data.servers.forEach((s: any) => {
            serverResolutions[s.endpoint.id] = {
                action: s.models.length > 0 ? 'select' : 'skip',
                model: s.models.length > 0 ? s.models[0].name : ''
            };
        });
    }

    function handleStatus(data: any) {
        if (data.isTagging && isOpen) {
            dispatch("started");
            close();
        }
    }

    function close() {
        isOpen = false;
        resolvingMismatch = false;
        mismatchData = null;
        dispatch("close");
    }

    function startTagging() {
        if (!selectedModel) return;
        loading = true;
        const token = localStorage.getItem('token');
        socket.emit("start-tagging", { model: selectedModel, token });
        // We don't close here, we wait for 'tagging-status' or 'tagging-model-mismatch'
        setTimeout(() => { loading = false; }, 2000); // safety fallback for loading state
    }

    function confirmMismatch() {
        const modelMap = { ...mismatchData.modelMap };
        for (const [id, res] of Object.entries(serverResolutions)) {
            modelMap[id] = res.action === 'skip' ? 'skip' : res.model;
        }
        loading = true;
        const token = localStorage.getItem('token');
        socket.emit("start-tagging-confirmed", { modelMap, token });
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

            <h2 class="text-2xl font-bold mb-6 text-white">
                {resolvingMismatch ? 'Missing Model on Server' : 'Auto Tag Videos'}
            </h2>

            {#if resolvingMismatch}
                <div class="space-y-4">
                    <p class="text-sm text-gray-300">
                        The model <span class="font-semibold text-white">{mismatchData.defaultModel}</span> is not available on some active servers. Please select an alternative or skip them.
                    </p>

                    <div class="space-y-3 max-h-60 overflow-y-auto">
                        {#each mismatchData.servers as server}
                            <div class="bg-gray-900 p-3 rounded border border-gray-700">
                                <div class="text-sm font-medium text-gray-200 mb-2 truncate" title={server.endpoint.url}>
                                    {server.endpoint.url}
                                </div>
                                <div class="flex items-center gap-3 mb-2">
                                    <label class="flex items-center gap-2 text-sm text-gray-400">
                                        <input type="radio" bind:group={serverResolutions[server.endpoint.id].action} value="select" class="accent-red-500" disabled={server.models.length === 0} />
                                        Use model:
                                    </label>
                                    <select
                                        bind:value={serverResolutions[server.endpoint.id].model}
                                        disabled={serverResolutions[server.endpoint.id].action !== 'select'}
                                        class="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-red-500"
                                    >
                                        {#each server.models as m}
                                            <option value={m.name}>{m.name}</option>
                                        {/each}
                                    </select>
                                </div>
                                <label class="flex items-center gap-2 text-sm text-gray-400">
                                    <input type="radio" bind:group={serverResolutions[server.endpoint.id].action} value="skip" class="accent-red-500" />
                                    Skip this server for this task
                                </label>
                            </div>
                        {/each}
                    </div>

                    <div class="pt-4 flex justify-end gap-3">
                        <button
                            on:click={close}
                            class="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition"
                            >Cancel</button
                        >
                        <button
                            on:click={confirmMismatch}
                            disabled={loading}
                            class="px-6 py-2 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                            {#if loading}<Loader2 class="inline animate-spin mr-2" size={16} />{/if}
                            Confirm and Start
                        </button>
                    </div>
                </div>
            {:else}
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
            {/if}
        </div>
    </div>
{/if}
