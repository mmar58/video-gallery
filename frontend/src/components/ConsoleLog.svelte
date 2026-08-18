<script>
    import { onMount, afterUpdate } from "svelte";
    import { socket, connectSocket, disconnectSocket } from "../lib/socket";
    import { fly } from "svelte/transition";
    import { X, Minimize2, Maximize2, Terminal, Trash2 } from "lucide-svelte";
    import { logStore, consoleVisibility } from "../stores/logStore";

    $: logs = $logStore;
    $: isOpen = $consoleVisibility.isOpen;
    $: isMinimized = $consoleVisibility.isMinimized;
    let logContainer;
    let isRunning = false;

    onMount(() => {
        connectSocket();

        socket.on("tagging-status", (data) => {
            isRunning = data.isTagging;
        });

        socket.on("tagging-log", (log) => {
            logStore.add(log.message, log.type);
            // Auto open if it's a "Starting..." message or if closed
            if (!isOpen && (log.message.includes("Starting") || isMinimized)) {
                if (isMinimized) consoleVisibility.update(v => ({ ...v, isMinimized: false }));
            }
            if (log.message.includes("Starting")) {
                consoleVisibility.set({ isOpen: true, isMinimized: false });
                isRunning = true;
            }
        });

        // Thumbnail Listeners
        socket.on("thumbnail-status", (data) => {
            isRunning = data.isGenerating;
        });

        socket.on("thumbnail-log", (log) => {
            logStore.add(log.message, log.type);
            if (!isOpen && (log.message.includes("Starting") || isMinimized)) {
                if (isMinimized) consoleVisibility.update(v => ({ ...v, isMinimized: false }));
            }
            if (log.message.includes("Starting")) {
                consoleVisibility.set({ isOpen: true, isMinimized: false });
                isRunning = true;
            }
        });

        return () => {
            socket.off("tagging-log");
            socket.off("tagging-complete");
            socket.off("tagging-status");
            socket.off("thumbnail-log");
            socket.off("thumbnail-status");
        };
    });

    afterUpdate(() => {
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    function toggleOpen() {
        consoleVisibility.update(v => {
            const nextOpen = !v.isOpen;
            return { isOpen: nextOpen, isMinimized: nextOpen ? false : v.isMinimized };
        });
    }

    function toggleMinimize() {
        consoleVisibility.update(v => ({ ...v, isMinimized: !v.isMinimized }));
    }

    function clearLogs() {
        logStore.clear();
    }

    function getLogColor(type) {
        switch (type) {
            case "error":
                return "text-red-400";
            case "warning":
                return "text-yellow-400";
            case "success":
                return "text-green-400";
            default:
                return "text-gray-300";
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed bottom-4 right-4 z-[9999] w-80 md:w-96 shadow-2xl rounded-lg overflow-hidden border border-gray-700 bg-gray-900 font-mono text-sm"
        transition:fly={{ y: 200, duration: 300 }}
    >
        <!-- Header -->
        <div
            class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700"
        >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                role="button"
                class="flex items-center gap-2 text-gray-100 cursor-pointer select-none hover:text-white transition-colors"
                on:click={toggleMinimize}
            >
                <Terminal size={16} />
                <span class="font-semibold">System Console</span>
            </div>
            <div class="flex items-center gap-1">
                {#if isRunning}
                    <button
                        on:click={() => {
                            socket.emit("stop-tagging");
                            socket.emit("stop-thumbnails");
                        }}
                        class="px-2 py-0.5 bg-red-900/50 hover:bg-red-900 text-red-200 text-xs rounded border border-red-800 uppercase font-bold mr-2 tracking-wider transition"
                    >
                        Stop
                    </button>
                {/if}

                <button
                    on:click={clearLogs}
                    class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    title="Clear"
                >
                    <Trash2 size={14} />
                </button>
                <button
                    on:click={toggleMinimize}
                    class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                    {#if isMinimized}
                        <Maximize2 size={14} />
                    {:else}
                        <Minimize2 size={14} />
                    {/if}
                </button>
                <button
                    on:click={toggleOpen}
                    class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                    <X size={14} />
                </button>
            </div>
        </div>

        <!-- Content -->
        {#if !isMinimized}
            <div
                bind:this={logContainer}
                class="h-64 overflow-y-auto p-4 bg-gray-900/95 space-y-1 scrollbar-thin scrollbar-thumb-gray-600"
            >
                {#if logs.length === 0}
                    <div class="text-gray-500 italic text-center py-4">
                        No logs yet...
                    </div>
                {/if}
                {#each logs as log}
                    <div class="flex gap-2 {getLogColor(log.type)}">
                        <span class="text-gray-600 select-none"
                            >[{log.timestamp.toLocaleTimeString()}]</span
                        >
                        <span>{log.message}</span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{:else}
    <!-- Floating Trigger Button -->
    <button
        on:click={toggleOpen}
        class="fixed bottom-4 right-4 z-[9999] bg-gray-800 text-white p-3 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700 transition-all flex items-center gap-2"
    >
        <Terminal size={20} />
        {#if logs.length > 0}
            <span
                class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full"
            >
                {logs.length > 99 ? "99+" : logs.length}
            </span>
        {/if}
    </button>
{/if}
