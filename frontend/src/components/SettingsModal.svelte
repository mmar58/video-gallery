<script>
    import { onMount } from "svelte";
    import { api } from "../lib/api";
    import { X, Settings2, Loader2, Save, FolderPlus, Trash2 } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import { authStore } from "../stores/auth";

    export let isOpen = false;
    export let onClose = () => {};

    let models = [];
    let selectedTagModel = "";
    let directories = [];
    let newDirName = "";
    let newDirPath = "";
    let loading = false;
    let saving = false;
    let dirLoading = false;
    let error = "";
    let dirError = "";

    let endpoints = [];
    let newEndpointUrl = "";
    let newEndpointWeight = 1;

    async function load() {
        console.log("[settings-debug] modal: load() start");
        loading = true;
        error = "";

        try {
            const [settings, availableModels] = await Promise.all([
                api.fetchOllamaSettings(),
                api.getModels(),
            ]);

            if ($authStore.user?.is_admin) {
                try {
                    directories = await api.fetchDirectories();
                } catch (e) {
                    console.error("Failed to fetch directories:", e);
                }
            }

            models = availableModels || [];

            const availableNames = models.map((model) => model.name);
            const savedModel = settings?.tagModel || "";
            
            endpoints = settings?.endpoints || [{ id: 'default', url: 'http://127.0.0.1:11434', weight: 1, active: true }];

            selectedTagModel = availableNames.includes(savedModel)
                ? savedModel
                : availableNames[0] || savedModel;
            console.log("[settings-debug] modal: load() success", {
                savedModel,
                modelCount: models.length,
                selectedTagModel,
            });
        } catch (err) {
            error = err.message || "Failed to load settings";
            console.error("[settings-debug] modal: load() failed", err);
        } finally {
            loading = false;
            console.log("[settings-debug] modal: load() end");
        }
    }

    onMount(() => {
        console.log("[settings-debug] modal: onMount");
        load();
    });

    $: console.log("[settings-debug] modal: isOpen =", isOpen);

    $: if (isOpen) {
        console.log("[settings-debug] modal: open detected, triggering load()");
        load();
    }

    function close() {
        console.log("[settings-debug] modal: close() called");
        onClose();
    }

    async function save() {
        console.log("[settings-debug] modal: save() start", { selectedTagModel });
        if (!selectedTagModel) return;

        saving = true;
        error = "";

        try {
            await api.saveOllamaSettings({ tagModel: selectedTagModel, endpoints });
            console.log("[settings-debug] modal: save() success");
            close();
        } catch (err) {
            error = err.message || "Failed to save settings";
            console.error("[settings-debug] modal: save() failed", err);
        } finally {
            saving = false;
            console.log("[settings-debug] modal: save() end");
        }
    }

    async function handleAddDirectory() {
        if (!newDirName || !newDirPath) return;
        dirLoading = true;
        dirError = "";
        try {
            const newDir = await api.addDirectory(newDirName, newDirPath);
            directories = [...directories, newDir];
            newDirName = "";
            newDirPath = "";
        } catch (err) {
            dirError = err.message || "Failed to add directory";
        } finally {
            dirLoading = false;
        }
    }

    async function handleDeleteDirectory(id) {
        if (!confirm("Are you sure you want to remove this root directory?")) return;
        dirLoading = true;
        dirError = "";
        try {
            await api.deleteDirectory(id);
            directories = directories.filter(d => d.id !== id);
        } catch (err) {
            dirError = err.message || "Failed to delete directory";
        } finally {
            dirLoading = false;
        }
    }

    function handleAddEndpoint() {
        if (!newEndpointUrl) return;
        endpoints = [...endpoints, {
            id: 'ep_' + Date.now(),
            url: newEndpointUrl,
            weight: newEndpointWeight || 1,
            active: true
        }];
        newEndpointUrl = "";
        newEndpointWeight = 1;
    }

    function handleRemoveEndpoint(id) {
        endpoints = endpoints.filter(ep => ep.id !== id);
    }
</script>

{#if isOpen}
    {@const _debugRender = console.log("[settings-debug] modal: render block visible")}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
            transition:fly={{ y: 16 }}
        >
            <div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class="rounded-xl bg-gray-800 p-2 text-cyan-300">
                        <Settings2 size={20} />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold text-white">Settings</h2>
                        <p class="text-sm text-gray-400">Choose the default Ollama model for auto-tagging.</p>
                    </div>
                </div>

                <button
                    onclick={close}
                    class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                    aria-label="Close settings"
                >
                    <X size={18} />
                </button>
            </div>

            <div class="space-y-5 px-5 py-5 max-h-[60vh] overflow-y-auto">
                {#if loading}
                    <div class="flex items-center gap-2 text-gray-400">
                        <Loader2 class="animate-spin" size={16} /> Loading Ollama settings...
                    </div>
                {:else}
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-300">Auto-tag model</label>
                        {#if models.length > 0}
                            <select
                                bind:value={selectedTagModel}
                                class="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                            >
                                {#each models as model}
                                    <option value={model.name}>{model.name}</option>
                                {/each}
                            </select>
                            <p class="text-sm text-gray-500">
                                This saved model becomes the default for the auto-tag UI and backend script runs.
                            </p>
                        {:else}
                            <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                No Ollama models were returned. Make sure Ollama is running and models are installed.
                            </div>
                        {/if}
                    </div>

                    <div class="pt-5 border-t border-gray-800 space-y-3">
                        <h3 class="text-md font-semibold text-white mb-2">Ollama Endpoints</h3>
                        <p class="text-xs text-gray-400 mb-3">Add multiple Ollama URLs for load balancing. Weight determines concurrency limit.</p>
                        
                        {#each endpoints as ep (ep.id)}
                            <div class="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                <div class="flex-1 overflow-hidden mr-3">
                                    <div class="text-sm font-medium text-gray-200 truncate" title={ep.url}>{ep.url}</div>
                                    <div class="text-xs text-gray-500">Weight (Concurrency): {ep.weight}</div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <label class="flex items-center cursor-pointer gap-2">
                                        <span class="text-xs text-gray-400">{ep.active ? 'Active' : 'Disabled'}</span>
                                        <input type="checkbox" bind:checked={ep.active} class="rounded border-gray-700 bg-gray-950 text-cyan-500 focus:ring-cyan-500" />
                                    </label>
                                    <button 
                                        onclick={() => handleRemoveEndpoint(ep.id)}
                                        class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        {/each}

                        <div class="mt-3 p-3 rounded-xl border border-gray-700 bg-gray-800/30">
                            <div class="flex gap-2 items-end">
                                <div class="flex-1">
                                    <label class="block text-xs font-medium text-gray-400 mb-1">Ollama URL</label>
                                    <input type="text" bind:value={newEndpointUrl} placeholder="http://192.168.1.5:11434" class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none" />
                                </div>
                                <div class="w-20">
                                    <label class="block text-xs font-medium text-gray-400 mb-1">Weight</label>
                                    <input type="number" bind:value={newEndpointWeight} min="1" class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none" />
                                </div>
                                <button
                                    onclick={handleAddEndpoint}
                                    disabled={!newEndpointUrl}
                                    class="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {#if error}
                        <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    {/if}

                    {#if $authStore.user?.is_admin}
                        <div class="pt-5 border-t border-gray-800 mt-5">
                            <h3 class="text-md font-semibold text-white mb-3">Root Directories</h3>
                            
                            {#if dirError}
                                <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-3">
                                    {dirError}
                                </div>
                            {/if}

                            <div class="space-y-3 mb-4">
                                {#each directories as dir}
                                    <div class="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                        <div class="overflow-hidden">
                                            <div class="text-sm font-medium text-gray-200">{dir.name}</div>
                                            <div class="text-xs text-gray-500 truncate" title={dir.path}>{dir.path}</div>
                                        </div>
                                        <button 
                                            onclick={() => handleDeleteDirectory(dir.id)}
                                            disabled={dirLoading}
                                            class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                {:else}
                                    <div class="text-sm text-gray-500">No directories configured.</div>
                                {/each}
                            </div>

                            <div class="space-y-3 p-4 rounded-xl border border-gray-700 bg-gray-800/30">
                                <h4 class="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <FolderPlus size={16} /> Add Directory
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                        <input type="text" bind:value={newDirName} placeholder="e.g. Movies" class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-400 mb-1">Path</label>
                                        <input type="text" bind:value={newDirPath} placeholder="/path/to/videos" class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none" />
                                    </div>
                                </div>
                                <button
                                    onclick={handleAddDirectory}
                                    disabled={dirLoading || !newDirName || !newDirPath}
                                    class="w-full mt-2 inline-flex justify-center items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
                                >
                                    {#if dirLoading}<Loader2 class="animate-spin" size={14} />{/if}
                                    Add Root Folder
                                </button>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>

            <div class="flex justify-end gap-3 border-t border-gray-800 px-5 py-4">
                <button
                    onclick={close}
                    class="rounded-lg px-4 py-2 text-gray-300 transition hover:bg-gray-800 hover:text-white"
                >
                    Cancel
                </button>
                <button
                    onclick={save}
                    disabled={loading || saving || !selectedTagModel}
                    class="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-gray-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {#if saving}
                        <Loader2 class="animate-spin" size={16} />
                    {:else}
                        <Save size={16} />
                    {/if}
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}