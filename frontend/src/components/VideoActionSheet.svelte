<script lang="ts">
    import {
        Heart,
        Plus,
        Edit2,
        Trash2,
        Image as ImageIcon,
        Info,
        Scissors,
        EyeOff,
        Eye,
        Film,
    } from "lucide-svelte";
    import BottomSheet from "./BottomSheet.svelte";
    import { videoMenu } from "../stores/uiStore";
    import {
        likeVideo,
        renameVideo,
        addTagToVideo,
        toggleHideVideo,
        deleteVideo,
        generateThumbnail,
        generatePreview,
        isVideoHidden,
    } from "../lib/videoActions";

    $: menu = $videoMenu;
    $: video = menu?.video;
    $: open = !!menu;
    $: hidden = video ? isVideoHidden(video) : false;

    function close() {
        videoMenu.set(null);
    }

    /** Close the sheet first, then run the action (dialogs stack above it). */
    function run(action: () => void | Promise<unknown>) {
        const current = menu;
        close();
        // Defer so the sheet's closing transition doesn't fight a dialog opening.
        setTimeout(() => action(), 0);
        return current;
    }

    function onSheetClose() {
        videoMenu.set(null);
    }
</script>

<BottomSheet
    {open}
    title={video ? video.displayName || video.name.split("::").pop() || video.name : ""}
    zIndex={90}
    on:close={onSheetClose}
>
    {#if video}
        <ul class="py-1">
            <li>
                <button class="row" on:click={() => run(() => menu?.onDetails?.())}>
                    <Info size={20} /> <span>Video info</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => likeVideo(video))}>
                    <Heart
                        size={20}
                        class={video.likes > 0 ? "fill-red-500 text-red-500" : ""}
                    />
                    <span>{video.likes > 0 ? `Liked (${video.likes})` : "Like"}</span>
                </button>
            </li>
            <li>
                <button
                    class="row"
                    on:click={() => run(() => addTagToVideo(video, () => menu?.onRefresh?.()))}
                >
                    <Plus size={20} /> <span>Add tag</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => renameVideo(video))}>
                    <Edit2 size={20} /> <span>Rename</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => menu?.onTrim?.())}>
                    <Scissors size={20} /> <span>Trim video</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => toggleHideVideo(video))}>
                    {#if hidden}<Eye size={20} />{:else}<EyeOff size={20} />{/if}
                    <span>{hidden ? "Unhide" : "Hide for some days"}</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => generateThumbnail(video))}>
                    <ImageIcon size={20} /> <span>Regenerate thumbnail</span>
                </button>
            </li>
            <li>
                <button class="row" on:click={() => run(() => generatePreview(video))}>
                    <Film size={20} /> <span>Regenerate animated preview</span>
                </button>
            </li>
            <li class="mt-1 border-t border-gray-800">
                <button class="row text-red-400" on:click={() => run(() => deleteVideo(video))}>
                    <Trash2 size={20} /> <span>Delete</span>
                </button>
            </li>
        </ul>
    {/if}
</BottomSheet>

<style>
    .row {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.9rem;
        min-height: 3.25rem;
        padding: 0 1.25rem;
        text-align: left;
        font-size: 0.95rem;
        color: #e5e7eb;
        transition: background 0.15s;
    }
    .row:active,
    .row:hover {
        background: rgba(255, 255, 255, 0.06);
    }
</style>
