<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import {
        X,
        Play,
        Square,
        Loader2,
        AlertTriangle,
        CheckCircle,
        Image as ImageIcon,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { io } from "socket.io-client";
    import ConsoleLog from "./ConsoleLog.svelte";

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let socket;
    let isGenerating = false;
    let progress = 0;
    let logs = []; // { message, type: 'info'|'success'|'warning'|'error', timestamp }

    // Options
    let forceRegenerate = false;
    let generatePreviews = true;

    // Connect to socket on mount (or when modal opens?)
    // Better to have one global socket, but for now specific connection is fine or reuse exists.
    // Let's create a new connection or reuse if passed?
    // For simplicity, new connection as per AutoTagModal pattern.

    function connect() {
        if (socket) return;

        socket = io("http://localhost:5000", {
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            addLog("Connected to server.", "success");
        });

        socket.on("thumbnail-log", (data) => {
            addLog(data.message, data.type);
        });

        socket.on("thumbnail-progress", (percent) => {
            progress = percent;
        });

        socket.on("thumbnail-status", (data) => {
            isGenerating = data.isGenerating;
            if (!isGenerating && progress === 100) {
                // complete
            }
        });
    }

    function disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }

    function addLog(message, type = "info") {
        logs = [{ message, type, timestamp: new Date() }, ...logs].slice(
            0,
            100,
        );
    }

    function startGeneration() {
        if (!socket) connect();
        progress = 0;
        logs = [];
        socket.emit("start-thumbnails", {
            force: forceRegenerate,
            previews: generatePreviews,
        });
    }

    function stopGeneration() {
        if (socket) {
            socket.emit("stop-thumbnails");
        }
    }

    $: if (isOpen) {
        connect();
    } else {
        // Optional: disconnect on close? Or keep running in background?
        // User might want to close modal but keep running.
        // For now, let's keep connection if generating.
        if (!isGenerating) disconnect();
    }

    onDestroy(() => {
        disconnect();
    });

    function close() {
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        transition:fade={{ duration: 200 }}
        on:click|self={close}
    >
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-800"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-orange-500/10 rounded-lg">
                        <ImageIcon class="text-orange-500" size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            Auto Thumbnails
                        </h2>
                        <p class="text-sm text-gray-400">
                            Bulk generate static thumbnails and animated
                            previews.
                        </p>
                    </div>
                </div>
                <button
                    on:click={close}
                    class="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition"
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 flex-1 overflow-y-auto space-y-6">
                <!-- Controls -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Options -->
                    <div class="space-y-4">
                        <div
                            class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50"
                        >
                            <h3 class="font-medium text-gray-200 mb-3">
                                Settings
                            </h3>

                            <label
                                class="flex items-center gap-3 cursor-pointer group"
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
                                <span
                                    class="text-gray-300 group-hover:text-white transition"
                                    >Force Regenerate All</span
                                >
                            </label>
                            <p class="text-xs text-gray-500 mt-1 ml-12">
                                If unchecked, skips videos that already have
                                thumbnails.
                            </p>

                            <div class="h-px bg-gray-700/50 my-3"></div>

                            <label
                                class="flex items-center gap-3 cursor-pointer group"
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
                                <span
                                    class="text-gray-300 group-hover:text-white transition"
                                    >Create Animated Previews</span
                                >
                            </label>
                            <p class="text-xs text-gray-500 mt-1 ml-12">
                                Generates sprite sheets for scrubbing effect.
                            </p>
                        </div>
                    </div>

                    <!-- Status -->
                    <div
                        class="flex flex-col justify-center items-center bg-gray-800/30 rounded-lg border border-gray-700/50 p-6 text-center"
                    >
                        {#if isGenerating}
                            <Loader2
                                class="animate-spin text-orange-500 mb-4"
                                size={48}
                            />
                            <h3 class="text-lg font-bold text-white mb-1">
                                Generating...
                            </h3>
                            <p class="text-gray-400 text-sm">
                                Processing videos
                            </p>
                        {:else}
                            <ImageIcon class="text-gray-600 mb-4" size={48} />
                            <h3
                                class="text-lg font-semibold text-gray-400 mb-1"
                            >
                                Ready
                            </h3>
                            <p class="text-gray-500 text-sm">
                                Click start to begin
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Progress Bar -->
                {#if isGenerating || progress > 0}
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Progress</span>
                            <span class="text-orange-400 font-mono"
                                >{progress}%</span
                            >
                        </div>
                        <div
                            class="h-2 bg-gray-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-gradient-to-r from-orange-600 to-red-500 transition-all duration-300 ease-out"
                                style="width: {progress}%"
                            ></div>
                        </div>
                    </div>
                {/if}

                <!-- Console Log -->
                <div
                    class="border border-gray-800 rounded-lg overflow-hidden flex flex-col h-48"
                >
                    <div
                        class="bg-gray-800 px-3 py-2 text-xs font-mono text-gray-400 border-b border-gray-700 flex justify-between items-center"
                    >
                        <span>CONSOLE_OUTPUT</span>
                        <button
                            class="text-gray-500 hover:text-white"
                            on:click={() => (logs = [])}>Clear</button
                        >
                    </div>
                    <div
                        class="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs bg-black/50"
                    >
                        {#each logs as log}
                            <div class="flex gap-2">
                                <span class="text-gray-600 shrink-0"
                                    >[{log.timestamp.toLocaleTimeString()}]</span
                                >
                                <span
                                    class:text-blue-400={log.type === "info"}
                                    class:text-green-400={log.type ===
                                        "success"}
                                    class:text-yellow-400={log.type ===
                                        "warning"}
                                    class:text-red-400={log.type === "error"}
                                >
                                    {log.message}
                                </span>
                            </div>
                        {/each}
                        {#if logs.length === 0}
                            <span class="text-gray-600 italic"
                                >Waiting for logs...</span
                            >
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 rounded-b-xl"
            >
                {#if isGenerating}
                    <button
                        on:click={stopGeneration}
                        class="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg transition flex items-center gap-2"
                    >
                        <Square size={16} fill="currentColor" /> Stop
                    </button>
                {:else}
                    <button
                        on:click={close}
                        class="px-5 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    >
                        Close
                    </button>
                    <button
                        on:click={startGeneration}
                        class="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-medium rounded-lg shadow-lg shadow-orange-900/20 transition flex items-center gap-2"
                    >
                        <Play size={18} fill="currentColor" /> Start Generation
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}
