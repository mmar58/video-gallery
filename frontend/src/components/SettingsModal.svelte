<script>
    import { onMount } from "svelte";
    import { api } from "../lib/api";
    import { X, Settings2, Loader2, Save } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    export let isOpen = false;
    export let onClose = () => {};

    let models = [];
    let selectedTagModel = "";
    let loading = false;
    let saving = false;
    let error = "";

    async function load() {
        console.log("[settings-debug] modal: load() start");
        loading = true;
        error = "";

        try {
            const [settings, availableModels] = await Promise.all([
                api.fetchOllamaSettings(),
                api.getModels(),
            ]);

            models = availableModels || [];

            const availableNames = models.map((model) => model.name);
            const savedModel = settings?.tagModel || "";

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
            await api.saveOllamaSettings({ tagModel: selectedTagModel });
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

            <div class="space-y-5 px-5 py-5">
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

                    {#if error}
                        <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
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