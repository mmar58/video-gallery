<script lang="ts">
    import { tick } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { dialogState, closeDialog } from "../stores/dialogStore";

    let value = "";
    let inputEl: HTMLInputElement | undefined;

    // Reset the input each time a prompt opens and focus it.
    $: if ($dialogState && $dialogState.kind === "prompt") {
        value = $dialogState.defaultValue ?? "";
        tick().then(() => {
            inputEl?.focus();
            inputEl?.select();
        });
    }

    function cancel() {
        if (!$dialogState) return;
        closeDialog($dialogState.kind === "confirm" ? false : null);
    }

    function submit() {
        if (!$dialogState) return;
        closeDialog($dialogState.kind === "confirm" ? true : value);
    }

    function onKeydown(e: KeyboardEvent) {
        if ($dialogState && e.key === "Escape") cancel();
    }
</script>

<svelte:window on:keydown={onKeydown} />

{#if $dialogState}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
        transition:fade={{ duration: 120 }}
        on:click={cancel}
    >
        <!-- svelte-ignore a11y-click-events-have-key-events, a11y-no-noninteractive-element-interactions -->
        <form
            class="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"
            transition:fly={{ y: 16, duration: 160 }}
            on:click|stopPropagation
            on:submit|preventDefault={submit}
        >
            {#if $dialogState.title}
                <h2 class="mb-1 text-lg font-semibold text-white">{$dialogState.title}</h2>
            {/if}
            <p class="mb-4 whitespace-pre-line break-words text-sm text-gray-300">
                {$dialogState.message}
            </p>

            {#if $dialogState.kind === "prompt"}
                <input
                    bind:this={inputEl}
                    bind:value
                    type={$dialogState.inputType || "text"}
                    inputmode={$dialogState.inputType === "number" ? "numeric" : undefined}
                    placeholder={$dialogState.placeholder || ""}
                    class="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-base text-white focus:border-red-500 focus:outline-none"
                />
            {/if}

            <div class="flex justify-end gap-2">
                <button
                    type="button"
                    class="min-h-11 rounded-lg bg-gray-800 px-4 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
                    on:click={cancel}
                >
                    {$dialogState.cancelLabel || "Cancel"}
                </button>
                <button
                    type="submit"
                    class="min-h-11 rounded-lg px-4 text-sm font-medium text-white transition hover:opacity-90 {$dialogState.destructive
                        ? 'bg-red-600'
                        : 'bg-gradient-to-r from-red-600 to-purple-600'}"
                >
                    {$dialogState.confirmLabel || "OK"}
                </button>
            </div>
        </form>
    </div>
{/if}
