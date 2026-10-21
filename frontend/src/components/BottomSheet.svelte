<script context="module" lang="ts">
    // Shared across all sheet instances so stacked sheets don't unlock scrolling early.
    let lockCount = 0;
</script>

<script lang="ts">
    import { createEventDispatcher, onDestroy } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { X } from "lucide-svelte";
    import { isMobile } from "../lib/device";

    /** Two-way bound visibility. */
    export let open = false;
    export let title = "";
    export let zIndex = 80;
    /** Tailwind max-width class used on desktop. */
    export let maxWidth = "md:max-w-lg";
    /** Fill the whole screen on phones instead of a bottom sheet. */
    export let fullOnMobile = false;

    const dispatch = createEventDispatcher();

    let locked = false;
    let dragY = 0;
    let dragging = false;
    let startY = 0;

    function close() {
        open = false;
        dispatch("close");
    }

    function onKeydown(e: KeyboardEvent) {
        if (open && e.key === "Escape") close();
    }

    function syncLock(isOpen: boolean) {
        if (typeof document === "undefined") return;
        if (isOpen && !locked) {
            locked = true;
            lockCount++;
            document.documentElement.style.overflow = "hidden";
        } else if (!isOpen && locked) {
            locked = false;
            lockCount--;
            if (lockCount <= 0) {
                lockCount = 0;
                document.documentElement.style.overflow = "";
            }
        }
    }

    $: syncLock(open);
    onDestroy(() => syncLock(false));

    // Swipe-down-to-dismiss from the drag handle (phones only).
    function dragStart(e: PointerEvent) {
        if (!$isMobile || fullOnMobile) return;
        dragging = true;
        startY = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    function dragMove(e: PointerEvent) {
        if (!dragging) return;
        dragY = Math.max(0, e.clientY - startY);
    }
    function dragEnd() {
        if (!dragging) return;
        dragging = false;
        const shouldClose = dragY > 100;
        dragY = 0;
        if (shouldClose) close();
    }
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 flex items-end justify-center bg-black/70 md:items-center md:p-4"
        style="z-index: {zIndex};"
        transition:fade={{ duration: 150 }}
        on:click={close}
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="flex w-full flex-col overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl md:rounded-2xl {maxWidth} {fullOnMobile
                ? 'h-[100dvh] rounded-none md:h-auto md:max-h-[85vh]'
                : 'max-h-[88dvh] rounded-t-2xl md:max-h-[85vh]'}"
            style="transform: translateY({dragY}px); transition: {dragging
                ? 'none'
                : 'transform 0.2s ease'}; padding-bottom: env(safe-area-inset-bottom, 0px);"
            transition:fly={{ y: $isMobile ? 480 : 24, duration: 220 }}
            on:click|stopPropagation
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            aria-label={title || "Dialog"}
        >
            <!-- Drag handle + header -->
            <div
                class="shrink-0 select-none border-b border-gray-800"
                style="touch-action: none;"
                on:pointerdown={dragStart}
                on:pointermove={dragMove}
                on:pointerup={dragEnd}
                on:pointercancel={dragEnd}
            >
                {#if $isMobile && !fullOnMobile}
                    <div class="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-600"></div>
                {/if}
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                    <h2 class="truncate text-base font-semibold text-white">{title}</h2>
                    <button
                        type="button"
                        class="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-800 hover:text-white"
                        aria-label="Close"
                        on:pointerdown|stopPropagation
                        on:click={close}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <slot />
            </div>

            {#if $$slots.footer}
                <div class="shrink-0 border-t border-gray-800 p-3">
                    <slot name="footer" />
                </div>
            {/if}
        </div>
    </div>
{/if}
