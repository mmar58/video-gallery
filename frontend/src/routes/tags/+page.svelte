<script>
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Trash2, Edit2, Ban, Search, Tag } from "lucide-svelte";
    import { fade } from "svelte/transition";

    import BlacklistModal from "../../components/BlacklistModal.svelte";

    let tags = [];
    let loading = true;
    let searchQuery = "";

    // Rename Modal State
    let isRenameOpen = false;
    let isBlacklistOpen = false;
    let tagToRename = null;
    let newTagName = "";

    onMount(loadTags);

    async function loadTags() {
        loading = true;
        try {
            tags = await api.fetchTagsWithStats();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleRename() {
        if (!tagToRename || !newTagName) return;
        try {
            await api.renameTag(tagToRename.name, newTagName);
            loadTags();
            closeRenameModal();
        } catch (e) {
            alert("Failed to rename tag");
        }
    }

    async function handleDelete(tag) {
        if (
            confirm(
                `Are you sure you want to delete tag "${tag.name}" from ALL videos?`,
            )
        ) {
            try {
                await api.deleteTag(tag.name);
                loadTags();
            } catch (e) {
                alert("Failed to delete tag");
            }
        }
    }

    async function handleBlacklist(tag) {
        if (
            confirm(
                `Blacklist "${tag.name}"? This will remove it from all videos and prevent it from being generated again.`,
            )
        ) {
            try {
                await api.blacklistTag(tag.name);
                loadTags();
            } catch (e) {
                alert("Failed to blacklist tag");
            }
        }
    }

    function openRenameModal(tag) {
        tagToRename = tag;
        newTagName = tag.name;
        isRenameOpen = true;
    }

    function closeRenameModal() {
        isRenameOpen = false;
        tagToRename = null;
        newTagName = "";
    }

    $: filteredTags = tags.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <div class="flex items-center gap-3">
                <Tag class="text-red-500" size={32} />
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent"
                >
                    Tags Manager
                </h1>
            </div>
            <a href="/" class="text-gray-400 hover:text-white underline"
                >Back to Gallery</a
            >
        </header>

        <div class="flex justify-end mb-4">
            <button
                on:click={() => (isBlacklistOpen = true)}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-red-400 rounded flex items-center gap-2 transition"
            >
                <Ban size={18} />
                Manage Global Blacklist
            </button>
        </div>

        <!-- Search -->
        <div class="mb-8 relative max-w-md">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
            />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search tags..."
                class="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500"
            />
        </div>

        {#if loading}
            <div class="text-center py-20 text-gray-500">Loading tags...</div>
        {:else if tags.length === 0}
            <div class="text-center py-20 text-gray-500">No tags found.</div>
        {:else}
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
                {#each filteredTags as tag (tag.name)}
                    <div
                        class="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center hover:border-gray-600 transition group"
                    >
                        <div
                            class="flex items-center gap-3 overflow-hidden flex-1"
                        >
                            <span
                                class="bg-gray-700 text-xs font-mono px-2 py-1 rounded-full text-gray-300 min-w-[2rem] text-center"
                            >
                                {tag.count}
                            </span>
                            <a
                                href="/tags/{encodeURIComponent(tag.name)}"
                                class="font-medium truncate hover:text-blue-400 transition"
                                title={tag.name}>{tag.name}</a
                            >
                        </div>

                        <div
                            class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                on:click={() => openRenameModal(tag)}
                                class="p-2 hover:bg-blue-900/50 text-gray-400 hover:text-blue-400 rounded-full transition"
                                title="Rename"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                on:click={() => handleBlacklist(tag)}
                                class="p-2 hover:bg-yellow-900/50 text-gray-400 hover:text-yellow-400 rounded-full transition"
                                title="Blacklist (Remove & Ban)"
                            >
                                <Ban size={16} />
                            </button>
                            <button
                                on:click={() => handleDelete(tag)}
                                class="p-2 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-full transition"
                                title="Delete from all videos"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Rename Modal -->
{#if isRenameOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
        >
            <h3 class="text-xl font-bold mb-4 text-white">Rename Tag</h3>
            <input
                type="text"
                bind:value={newTagName}
                class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none mb-6"
                placeholder="New name..."
                autofocus
            />
            <div class="flex justify-end gap-3">
                <button
                    on:click={closeRenameModal}
                    class="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition"
                    >Cancel</button
                >
                <button
                    on:click={handleRename}
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition"
                    >Save</button
                >
            </div>
        </div>
    </div>
{/if}

<BlacklistModal bind:isOpen={isBlacklistOpen} />
