<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { videoStore } from "../stores/videoStore";
    import { toast } from "../stores/toastStore";
    import { logStore, consoleVisibility } from "../stores/logStore";
    import { api } from "../lib/api";

    import { useVideoFilters } from "../lib/useVideoFilters";
    import { usePlayerManager } from "../lib/usePlayerManager";
    import { useMultiSelect } from "../lib/useMultiSelect";

    import GalleryHeader from "../components/GalleryHeader.svelte";
    import GalleryControls from "../components/GalleryControls.svelte";
    import StatsChips from "../components/StatsChips.svelte";
    import VideoGrid from "../components/VideoGrid.svelte";
    import Pagination from "../components/Pagination.svelte";
    import BulkSelectionBar from "../components/BulkSelectionBar.svelte";

    import VideoPlayer from "../components/VideoPlayer.svelte";
    import AutoTagModal from "../components/AutoTagModal.svelte";
    import AutoThumbnailModal from "../components/AutoThumbnailModal.svelte";
    import BlacklistModal from "../components/BlacklistModal.svelte";
    import VideoDetailsModal from "../components/VideoDetailsModal.svelte";
    import VideoTrimModal from "../components/VideoTrimModal.svelte";
    import BulkDeleteModal from "../components/BulkDeleteModal.svelte";
    import BulkRenameModal from "../components/BulkRenameModal.svelte";

    // Modals state
    let isAutoTagOpen = false;
    let isAutoThumbnailOpen = false;
    let isBlacklistOpen = false;
    let isDetailsOpen = false;
    let isTrimOpen = false;
    let isBulkDeleteOpen = false;
    let isBulkRenameOpen = false;
    let selectedVideo: any = null;

    // Composables
    const filters = useVideoFilters();
    const player = usePlayerManager();
    const selection = useMultiSelect();

    // Extract stores from composables for template usage
    const { searchValue, sortValue, tagValue, dateFrom, dateTo, isHidden, jumpToPage } = filters;
    const { activeVideos } = player;
    const { selectionMode, selectedVideoNames, selectedVideos, selectedCount, selectedTotalSize } = selection;

    onMount(async () => {
        await filters.init($page.url.searchParams);
    });

    $: filters.syncHiddenFromUrl($page.url.searchParams.get("hidden"));
    $: {
        // Trigger filter check on changes
        $searchValue; $sortValue; $tagValue; $dateFrom; $dateTo; $isHidden;
        filters.checkFilterChangesAndLoad();
    }
    $: filters.syncToUrl($videoStore, $page.url.search);

    async function handleBulkDeleteConfirm(e: CustomEvent) {
        const { videos } = e.detail;
        const total = videos.length;
        
        selection.reset();
        
        // Optimistic update - remove videos from view immediately
        videoStore.removeMany(videos.map((v: any) => v.name));

        toast.success(`Started deleting ${total} video(s) in background`);
        consoleVisibility.set({ isOpen: true, isMinimized: false });
        logStore.add(`Starting bulk deletion of ${total} video(s)...`, 'info');
        
        let deletedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < total; i++) {
            const video = videos[i];
            const name = video.displayName || video.name?.split("::")?.pop() || video.name;
            try {
                await api.deleteVideo(video.name);
                deletedCount++;
                logStore.add(`Deleted (${i + 1}/${total}): ${name}`, 'success');
            } catch (err) {
                failedCount++;
                logStore.add(`Failed to delete (${i + 1}/${total}): ${name}`, 'error');
            }
        }
        
        logStore.add(`Bulk deletion complete. ${deletedCount} deleted, ${failedCount} failed.`, 'info');
        filters.checkFilterChangesAndLoad();
    }

    function handleBulkRenamed(e: CustomEvent) {
        const { okCount, errCount } = e.detail;
        filters.checkFilterChangesAndLoad();
        selection.reset();
        if (okCount > 0) toast.success(`Renamed ${okCount} video(s)`);
        if (errCount > 0) toast.error(`${errCount} rename(s) failed`);
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-6">
    <GalleryHeader
        bind:searchValue={$searchValue}
        bind:sortValue={$sortValue}
        bind:tagValue={$tagValue}
        bind:dateFrom={$dateFrom}
        bind:dateTo={$dateTo}
        tags={$videoStore.tags}
    />

    <StatsChips
        stats={$videoStore.stats}
        on:daterange={(e) => filters.setManualDates(e.detail.from, e.detail.to)}
    />

    <GalleryControls
        selectionMode={$selectionMode}
        on:quickdays={(e) => filters.setQuickDays(e.detail)}
        on:prevmonth={() => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            filters.setManualDates(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
        }}
        on:cleardates={() => filters.clearDates()}
        on:randomize={() => ($sortValue = "random")}
        on:autotag={() => (isAutoTagOpen = true)}
        on:autothumb={() => (isAutoThumbnailOpen = true)}
        on:toggleselect={() => selection.toggleMode()}
    />

    <AutoTagModal bind:isOpen={isAutoTagOpen} />
    <AutoThumbnailModal bind:isOpen={isAutoThumbnailOpen} />
    <BlacklistModal bind:isOpen={isBlacklistOpen} />
    <VideoDetailsModal
        bind:isOpen={isDetailsOpen}
        video={selectedVideo}
        on:trim={(e) => {
            selectedVideo = e.detail;
            isTrimOpen = true;
            isDetailsOpen = false;
        }}
    />
    <VideoTrimModal
        bind:isOpen={isTrimOpen}
        video={selectedVideo}
        on:refresh={() => videoStore.load($searchValue, $sortValue, $videoStore.page, $tagValue)}
    />
    <BulkDeleteModal
        bind:isOpen={isBulkDeleteOpen}
        videos={$selectedVideos}
        on:confirm={handleBulkDeleteConfirm}
    />
    <BulkRenameModal
        bind:isOpen={isBulkRenameOpen}
        videos={$selectedVideos}
        on:renamed={handleBulkRenamed}
    />

    <VideoGrid
        videos={$videoStore.videos}
        loading={$videoStore.loading}
        error={$videoStore.error}
        selectionMode={$selectionMode}
        selectedVideoNames={$selectedVideoNames}
        on:play={(e) => player.handlePlay(e.detail)}
        on:select={(e) => selection.toggleSelectVideo(e.detail)}
        on:refresh={() => videoStore.load($searchValue, $sortValue, $videoStore.page, $tagValue)}
        on:details={(e) => {
            selectedVideo = e.detail;
            isDetailsOpen = true;
        }}
        on:trim={(e) => {
            selectedVideo = e.detail;
            isTrimOpen = true;
            isDetailsOpen = false;
        }}
    >
        <BulkSelectionBar
            selectionMode={$selectionMode}
            selectedCount={$selectedCount}
            selectedTotalSize={$selectedTotalSize}
            on:selectall={() => selection.selectAll($videoStore.videos)}
            on:clearnone={() => selection.clearSelection()}
            on:rename={() => (isBulkRenameOpen = true)}
            on:delete={() => (isBulkDeleteOpen = true)}
            on:exit={() => selection.toggleMode()}
        />
    </VideoGrid>

    <Pagination
        page={$videoStore.page}
        maxPage={$videoStore.maxPage}
        bind:jumpToPage={$jumpToPage}
        on:setpage={(e) => filters.handlePageInput(e.detail, $videoStore.maxPage)}
    />

    {#each $activeVideos as video (video.id)}
        <VideoPlayer
            {video}
            zIndex={video.zIndex}
            on:close={() => player.handleClosePlayer(video.id)}
            on:focus={() => player.handleFocusPlayer(video.id)}
        />
    {/each}
</div>
