<script>
    import { api } from "$lib/api";
    import { base } from "$app/paths";
    import { fade } from "svelte/transition";
    import { Upload, X, Film, ArrowLeft } from "lucide-svelte";

    let files = [];
    let uploading = false;
    let progress = 0;
    let status = "";
    let dragOver = false;

    // Handle Drag & Drop
    function handleDrop(e) {
        e.preventDefault();
        dragOver = false;
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    }

    function handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter((file) =>
            file.type.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi|flv|wmv|m4v)$/i.test(file.name),
        );
        files = [...files, ...newFiles];
    }

    function removeFile(index) {
        files = files.filter((_, i) => i !== index);
    }

    function handleDragOver(e) {
        e.preventDefault();
        dragOver = true;
    }

    function handleDragLeave() {
        dragOver = false;
    }

    function handleSelect(e) {
        handleFiles(e.target.files);
    }

    async function upload() {
        if (files.length === 0) return;

        uploading = true;
        status = "Uploading...";
        progress = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append("video", file);

            try {
                await api.uploadVideo(formData, (p) => {
                    progress = p;
                });
                status = `Uploaded ${file.name}`;
            } catch (err) {
                status = `Error uploading ${file.name}`;
                console.error(err);
            }
        }

        uploading = false;
        files = [];
        setTimeout(() => (status = ""), 3000);
    }
</script>

<div
    class="min-h-screen bg-gray-900 text-gray-100 p-3 sm:p-6 pb-24 md:pb-6 flex items-center justify-center"
>
    <div
        class="w-full max-w-2xl bg-gray-800 rounded-2xl p-5 sm:p-8 shadow-2xl border border-gray-700"
    >
        <div class="flex items-center justify-between mb-6">
            <a
                href="{base}/"
                class="p-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 rounded-full transition md:hidden"
                aria-label="Back to gallery"
            >
                <ArrowLeft size={20} />
            </a>
            <h1
                class="text-2xl sm:text-3xl font-bold flex-1 text-center bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent"
            >
                Upload Videos
            </h1>
            <div class="w-9 md:hidden"></div>
        </div>

        <div
            class="border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all cursor-pointer select-none active:scale-[0.99]
                    {dragOver
                ? 'border-red-500 bg-gray-700/50'
                : 'border-gray-600 hover:border-gray-500 bg-gray-900/30'}"
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:click={() => document.getElementById("fileInput").click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("fileInput").click();
                }
            }}
        >
            <input
                type="file"
                id="fileInput"
                class="hidden"
                multiple
                accept="video/*"
                on:change={handleSelect}
            />

            <div class="pointer-events-none">
                <Upload
                    class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400"
                />
                <p class="text-base sm:text-lg font-medium text-gray-200">
                    Tap to browse or drop videos here
                </p>
                <p class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">MP4, WebM, MKV, MOV</p>
            </div>
        </div>

        {#if files.length > 0}
            <div class="mt-6 space-y-3 sm:space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-base sm:text-lg">
                        Selected Files ({files.length})
                    </h3>
                    <button
                        on:click={() => (files = [])}
                        class="text-xs text-red-400 hover:text-red-300 underline"
                        >Clear all</button
                    >
                </div>
                <div
                    class="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin"
                >
                    {#each files as file, index}
                        <div
                            class="bg-gray-700/50 p-2.5 sm:p-3 rounded-lg flex items-center justify-between gap-2 border border-gray-700"
                        >
                            <div class="flex items-center gap-2 overflow-hidden flex-1">
                                <Film size={18} class="text-blue-400 shrink-0" />
                                <span class="truncate text-sm text-gray-200">{file.name}</span>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-xs text-gray-400 font-mono"
                                    >{(file.size / (1024 * 1024)).toFixed(1)} MB</span
                                >
                                <button
                                    on:click|stopPropagation={() => removeFile(index)}
                                    class="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>

                <button
                    on:click={upload}
                    disabled={uploading}
                    class="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-950/30 flex items-center justify-center gap-2"
                >
                    <Upload size={18} />
                    <span>{uploading ? "Uploading..." : `Upload ${files.length} ${files.length === 1 ? 'Video' : 'Videos'}`}</span>
                </button>
            </div>
        {/if}

        {#if uploading}
            <div class="mt-4">
                <div class="bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div
                        class="bg-red-500 h-full transition-all duration-300"
                        style="width: {progress}%"
                    ></div>
                </div>
                <p class="text-right text-xs sm:text-sm text-gray-400 mt-1 font-mono">
                    {Math.round(progress)}%
                </p>
            </div>
        {/if}

        {#if status}
            <div
                class="mt-4 p-3 rounded-lg bg-gray-700/60 text-center text-sm border border-gray-600"
                transition:fade
            >
                {status}
            </div>
        {/if}

        <div class="mt-6 text-center hidden md:block">
            <a href="{base}/" class="text-sm text-gray-400 hover:text-white underline"
                >Back to Gallery</a
            >
        </div>
    </div>
</div>
