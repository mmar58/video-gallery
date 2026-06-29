<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { api } from "../lib/api";
    import { toast } from "../stores/toastStore";
    import { X, Scissors, Save, Play, Pause } from "lucide-svelte";

    export let isOpen = false;
    export let video = null;

    const dispatch = createEventDispatcher();
    let videoEl;
    let startTime = 0;
    let endTime = 0;
    let currentTime = 0;
    let duration = 0;
    let isPlaying = false;
    let saveAsNew = true;
    let newName = "";
    let lastVideoName = "";
    let mode = "trim"; // 'trim' or 'split'
    let splitTime = 0;

    // Reset state when opening
    $: if (isOpen && video && video.name !== lastVideoName) {
        lastVideoName = video.name;
        startTime = 0;
        endTime = 0; // Will update once metadata loads
        currentTime = 0;
        splitTime = 0;
        mode = "trim";
        newName = video.name;
        if (videoEl) videoEl.load();
    }

    $: if (!isOpen) {
        lastVideoName = "";
    }

    function handleLoadedMetadata() {
        duration = videoEl.duration;
        if (endTime === 0) endTime = duration;
    }

    function handleTimeUpdate() {
        currentTime = videoEl.currentTime;
        // Optional: Loop preview if playing
        if (isPlaying && currentTime >= endTime) {
            videoEl.pause();
            isPlaying = false;
            videoEl.currentTime = endTime;
        }
    }

    function setStart() {
        startTime = videoEl.currentTime;
        if (startTime >= endTime) {
            endTime = duration; // Reset end if invalid
        }
        toast.info(`Start time set to ${formatTime(startTime)}`);
    }

    function setEnd() {
        endTime = videoEl.currentTime;
        if (endTime <= startTime) {
            startTime = 0; // Reset start if invalid
        }
        toast.info(`End time set to ${formatTime(endTime)}`);
    }

    function togglePlay() {
        if (videoEl.paused) {
            videoEl.play();
            isPlaying = true;
        } else {
            videoEl.pause();
            isPlaying = false;
        }
    }

    function handleTimelineClick(e) {
        if (!duration || !videoEl) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        videoEl.currentTime = percentage * duration;
    }

    function previewTrim() {
        videoEl.currentTime = startTime;
        videoEl.play();
        isPlaying = true;
    }

    function setSplitTime() {
        splitTime = videoEl.currentTime;
        toast.info(`Split time set to ${formatTime(splitTime)}`);
    }

    async function handleTrim(overwriteTarget = false) {
        if (startTime >= endTime) {
            toast.error("Invalid trim range");
            return;
        }

        try {
            toast.info("Trimming video...");
            await api.trimVideo(
                video.name,
                startTime,
                endTime,
                saveAsNew,
                newName,
                overwriteTarget
            );
            toast.success(overwriteTarget ? "Video replaced successfully!" : "Video trimmed successfully!");
            dispatch("refresh"); // Reload list
            close();
        } catch (e) {
            if (e.message === "FILE_EXISTS") {
                const confirmReplace = confirm("File already exists. Do you want to replace it?");
                if (confirmReplace) {
                    await handleTrim(true);
                } else {
                    toast.info("Trim cancelled.");
                }
            } else {
                console.error(e);
                toast.error(`Trim failed: ${e.message}`);
            }
        }
    }

    async function handleSplit() {
        if (splitTime <= 0 || splitTime >= duration) {
            toast.error("Invalid split time");
            return;
        }

        try {
            toast.info("Splitting video...");
            await api.splitVideo(video.name, splitTime);
            toast.success("Video split successfully!");
            dispatch("refresh");
            close();
        } catch (e) {
            console.error(e);
            toast.error(`Split failed: ${e.message}`);
        }
    }

    function close() {
        isOpen = false;
        if (videoEl) {
            videoEl.pause();
            isPlaying = false;
        }
        dispatch("close");
    }

    function formatTime(seconds) {
        if (!seconds && seconds !== 0) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
    }
</script>

{#if isOpen && video}
    <div
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
        <div
            class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]"
        >
            <!-- Header -->
            <div
                class="flex justify-between items-center p-4 border-b border-gray-800"
            >
                <h2
                    class="text-xl font-bold flex items-center gap-2 text-white"
                >
                    <Scissors class="text-red-500" /> Trim Video:
                    <span
                        class="text-gray-400 text-base font-normal truncate max-w-[300px]"
                        >{video.name}</span
                    >
                </h2>
                <button
                    on:click={close}
                    class="text-gray-500 hover:text-white transition"
                >
                    <X />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <!-- Video Player -->
                <div
                    class="bg-black rounded-lg overflow-hidden aspect-video relative group border border-gray-800"
                >
                    <video
                        bind:this={videoEl}
                        src={api.getStreamUrl(video.name)}
                        class="w-full h-full object-contain"
                        on:loadedmetadata={handleLoadedMetadata}
                        on:timeupdate={handleTimeUpdate}
                        on:click={togglePlay}
                    ></video>

                    <!-- Play Overlay -->
                    {#if !isPlaying}
                        <div
                            class="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <Play size={48} class="text-white/50" />
                        </div>
                    {/if}
                </div>
                
                <!-- Mode Toggle -->
                <div class="flex gap-4 border-b border-gray-800 pb-2">
                    <button 
                        on:click={() => mode = 'trim'} 
                        class="text-sm font-semibold transition-colors {mode === 'trim' ? 'text-red-500' : 'text-gray-400 hover:text-white'}"
                    >
                        Trim Mode
                    </button>
                    <button 
                        on:click={() => mode = 'split'} 
                        class="text-sm font-semibold transition-colors {mode === 'split' ? 'text-red-500' : 'text-gray-400 hover:text-white'}"
                    >
                        Split Mode
                    </button>
                </div>

                <!-- Controls -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#if mode === 'trim'}
                    <!-- Time Controls -->
                    <div
                        class="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700"
                    >
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-gray-400 text-sm font-mono"
                                >Current: {formatTime(currentTime)} / {formatTime(
                                    duration,
                                )}</span
                            >
                            <button
                                on:click={previewTrim}
                                class="text-blue-400 text-sm hover:underline"
                                >Preview Range</button
                            >
                        </div>

                        <!-- Scrubber / Range Visualization -->
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="h-2 bg-gray-700 rounded-full relative overflow-hidden cursor-pointer"
                            on:click={handleTimelineClick}
                        >
                            <div
                                class="absolute top-0 bottom-0 bg-red-500/30"
                                style="left: {(startTime / duration) *
                                    100}%; width: {((endTime - startTime) /
                                    duration) *
                                    100}%"
                            ></div>
                            <div
                                class="absolute top-0 bottom-0 w-1 bg-white"
                                style="left: {(currentTime / duration) * 100}%"
                            ></div>
                        </div>

                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label class="block text-xs text-gray-400 mb-1"
                                    >Start Time</label
                                >
                                <div class="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        bind:value={startTime}
                                        class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                    />
                                    <button
                                        on:click={setStart}
                                        class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                                        >Set Current</button
                                    >
                                </div>
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs text-gray-400 mb-1"
                                    >End Time</label
                                >
                                <div class="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        bind:value={endTime}
                                        class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                    />
                                    <button
                                        on:click={setEnd}
                                        class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                                        >Set Current</button
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Output Options -->
                    <div
                        class="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col justify-center"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="saveNew"
                                bind:checked={saveAsNew}
                                class="rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500"
                            />
                            <label
                                for="saveNew"
                                class="text-white text-sm select-none"
                                >Save as new video</label
                            >
                        </div>

                        {#if saveAsNew}
                            <div>
                                <label class="block text-xs text-gray-400 mb-1"
                                    >New Filename</label
                                >
                                <input
                                    type="text"
                                    bind:value={newName}
                                    class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    placeholder="Enter filename..."
                                />
                            </div>
                        {:else}
                            <div
                                class="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-xs"
                            >
                                <strong class="block mb-1">⚠️ Warning</strong>
                                This will permanently overwrite the original video
                                file.
                            </div>
                        {/if}

                        <button
                            on:click={() => handleTrim(false)}
                            class="w-full mt-auto py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95"
                        >
                            <Scissors size={20} />
                            {saveAsNew ? "Trim & Save" : "Trim & Overwrite"}
                        </button>
                    </div>
                    {:else}
                    <!-- Split Controls -->
                    <div class="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-gray-400 text-sm font-mono"
                                >Current: {formatTime(currentTime)} / {formatTime(duration)}</span
                            >
                        </div>
                        <div
                            class="h-2 bg-gray-700 rounded-full relative overflow-hidden cursor-pointer"
                            on:click={handleTimelineClick}
                        >
                            <div
                                class="absolute top-0 bottom-0 w-1 bg-red-500"
                                style="left: {(splitTime / duration) * 100}%"
                            ></div>
                            <div
                                class="absolute top-0 bottom-0 w-1 bg-white"
                                style="left: {(currentTime / duration) * 100}%"
                            ></div>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Split Point</label>
                            <div class="flex gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    bind:value={splitTime}
                                    class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                />
                                <button
                                    on:click={setSplitTime}
                                    class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                                >Set Current</button>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col justify-center">
                        <p class="text-sm text-gray-300">This will split the video into two parts exactly at the specified point, creating two new files.</p>
                        <button
                            on:click={handleSplit}
                            class="w-full mt-auto py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95"
                        >
                            <Scissors size={20} />
                            Split Video
                        </button>
                    </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
