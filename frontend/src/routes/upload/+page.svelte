<script>
    import { api } from "$lib/api";
    import { writable } from "svelte/store";
    import { fade } from "svelte/transition";

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
        files = Array.from(fileList).filter((file) =>
            file.type.startsWith("video/"),
        );
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
    class="min-h-screen bg-gray-900 text-gray-100 p-6 flex items-center justify-center"
>
    <div
        class="w-full max-w-2xl bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700"
    >
        <h1
            class="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent"
        >
            Upload Videos
        </h1>

        <div
            class="border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                    {dragOver
                ? 'border-red-500 bg-gray-700/50'
                : 'border-gray-600 hover:border-gray-500'}"
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:click={() => document.getElementById("fileInput").click()}
            role="button"
            tabindex="0"
            on:keydown={() => document.getElementById("fileInput").click()}
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
                <svg
                    class="w-12 h-12 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
                <p class="text-lg font-medium text-gray-300">
                    Drop videos here or click to select
                </p>
                <p class="text-sm text-gray-500 mt-2">MP4, WebM, OGG</p>
            </div>
        </div>

        {#if files.length > 0}
            <div class="mt-8 space-y-4">
                <h3 class="font-semibold text-lg">
                    Selected Files ({files.length})
                </h3>
                <div
                    class="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin"
                >
                    {#each files as file}
                        <div
                            class="bg-gray-700/50 p-3 rounded flex items-center justify-between"
                        >
                            <span class="truncate">{file.name}</span>
                            <span class="text-sm text-gray-400"
                                >{(file.size / (1024 * 1024)).toFixed(1)} MB</span
                            >
                        </div>
                    {/each}
                </div>

                <button
                    on:click={upload}
                    disabled={uploading}
                    class="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? "Uploading..." : "Upload Files"}
                </button>
            </div>
        {/if}

        {#if uploading}
            <div class="mt-4">
                <div class="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                        class="bg-red-500 h-full transition-all duration-300"
                        style="width: {progress}%"
                    ></div>
                </div>
                <p class="text-right text-sm text-gray-400 mt-1">
                    {Math.round(progress)}%
                </p>
            </div>
        {/if}

        {#if status}
            <div
                class="mt-4 p-4 rounded bg-gray-700/50 text-center"
                transition:fade
            >
                {status}
            </div>
        {/if}

        <div class="mt-6 text-center">
            <a href="/" class="text-gray-400 hover:text-white underline"
                >Back to Gallery</a
            >
        </div>
    </div>
</div>
