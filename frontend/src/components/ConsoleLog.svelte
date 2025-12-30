<script>
    import { onMount, afterUpdate } from "svelte";
    import { socket, connectSocket, disconnectSocket } from "../lib/socket";
    import { fly } from "svelte/transition";
    import { X, Minimize2, Maximize2, Terminal, Trash2 } from "lucide-svelte";

    let logs = [];
    let isOpen = false;
    let isMinimized = true;
    let logContainer;

    onMount(() => {
        connectSocket();

        socket.on("tagging-log", (log) => {
            logs = [...logs, { ...log, timestamp: new Date() }];
            // Auto open if it's a "Starting..." message or if closed
            if (!isOpen && (log.message.includes("Starting") || isMinimized)) {
                isOpen = true;
                isMinimized = false;
            }
        });

        // Optional: listen for completion
        socket.on("tagging-complete", () => {
            logs = [
                ...logs,
                {
                    message: "Process finished.",
                    type: "info",
                    timestamp: new Date(),
                },
            ];
        });

        return () => {
            socket.off("tagging-log");
            socket.off("tagging-complete");
        };
    });

    afterUpdate(() => {
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    function toggleOpen() {
        isOpen = !isOpen;
        if (isOpen) isMinimized = false;
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
    }

    function clearLogs() {
        logs = [];
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
            <div class="flex items-center gap-2 text-gray-100">
                <Terminal size={16} />
                <span class="font-semibold">System Console</span>
            </div>
            <div class="flex items-center gap-1">
                {#if logs.length > 0 && !logs[logs.length - 1].message.includes("complete") && !logs[logs.length - 1].message.includes("Stopped")}
                    <button
                        on:click={() => socket.emit("stop-tagging")}
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
