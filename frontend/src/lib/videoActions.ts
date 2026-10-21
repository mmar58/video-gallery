import { videoStore } from "../stores/videoStore";
import { toast } from "../stores/toastStore";
import { logStore } from "../stores/logStore";
import { confirmDialog, promptDialog } from "../stores/dialogStore";
import { api } from "./api";

/**
 * Shared per-video actions used by the desktop hover overlay (VideoCard)
 * and the mobile action sheet (VideoActionSheet), so the logic lives in one place.
 */

export function isVideoHidden(video: any): boolean {
    return !!(video.hideUntil && video.hideUntil > Date.now());
}

export function likeVideo(video: any) {
    videoStore.toggleLike(video.name);
}

export async function renameVideo(video: any) {
    const defaultName = video.displayName || video.name.split("::").pop() || video.name;
    const newName = await promptDialog("Rename video:", defaultName, {
        title: "Rename video",
        confirmLabel: "Rename",
    });
    if (newName && newName !== defaultName && newName !== video.name) {
        videoStore.rename(video.name, newName);
    }
}

export async function addTagToVideo(video: any, onDone?: () => void) {
    const tag = await promptDialog("Enter new tag:", "", {
        title: "Add tag",
        confirmLabel: "Add",
        placeholder: "Tag name",
    });
    if (tag) {
        await videoStore.addTag(video.name, tag);
        onDone?.();
    }
}

export async function toggleHideVideo(video: any) {
    if (isVideoHidden(video)) {
        // Already hidden, unhide
        videoStore.hideVideo(video.name, 0);
        return;
    }
    const daysStr = await promptDialog("Hide for how many days?", "7", {
        title: "Hide video",
        confirmLabel: "Hide",
        inputType: "number",
    });
    if (daysStr) {
        const days = parseInt(daysStr, 10);
        if (!isNaN(days) && days > 0) {
            videoStore.hideVideo(video.name, days);
        }
    }
}

export async function deleteVideo(video: any) {
    const ok = await confirmDialog(`Delete ${video.name}?`, {
        title: "Delete video",
        confirmLabel: "Delete",
        destructive: true,
    });
    if (ok) videoStore.remove(video.name);
}

export async function generateThumbnail(video: any) {
    try {
        toast.info(`Generating thumbnail for ${video.name}...`);
        logStore.add(`Generating thumbnail for ${video.name}...`);
        await api.generateThumbnail(video.name);

        // Force refresh image
        const img = document.querySelector(`img[data-vid="${video.name}"]`) as HTMLImageElement;
        if (img) img.src = api.getThumbnailUrl(video.name) + "?t=" + Date.now();

        toast.success("Thumbnail generated!");
        logStore.add(`Thumbnail generated for ${video.name}`, "success");
        return true;
    } catch (err: any) {
        toast.error("Failed to generate thumbnail");
        logStore.add(`Error generating thumbnail for ${video.name}: ${err.message}`, "error");
        return false;
    }
}

export async function generatePreview(video: any, onDone?: () => void) {
    try {
        toast.info(`Generating preview for ${video.name}...`);
        logStore.add(`Generating preview for ${video.name}...`);
        await api.generatePreview(video.name);
        onDone?.();

        toast.success("Preview generated! Hover to see effect.");
        logStore.add(`Preview generated for ${video.name}`, "success");
        return true;
    } catch (err: any) {
        toast.error("Failed to generate preview");
        logStore.add(`Error generating preview for ${video.name}: ${err.message}`, "error");
        return false;
    }
}
