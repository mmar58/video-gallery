<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { api } from "../lib/api";

  export let video: any;
  export let zIndex: number = 100;

  const dispatch = createEventDispatcher();
  let videoEl: HTMLVideoElement;
  let containerEl: HTMLDivElement;

  let isDragging = false;
  let startX: number, startY: number, startLeft: number, startTop: number;

  let audioTracks: any[] = [];
  let showTrackMenu = false;

  // Initial position (center-ish)
  let left = 20;
  let top = 20;
  let width = 640;

  onMount(() => {
    if (typeof window !== "undefined") {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Responsive width: 90% on mobile, max 640px default
      if (vw < 768) {
        width = Math.min(vw * 0.9, 640);
        left = (vw - width) / 2;
        top = 60 + Math.random() * 20;
      } else {
        width = 640;
        left = 100 + Math.random() * 50;
        top = 100 + Math.random() * 50;
      }

      // Clamp initial position so the player starts inside the viewport
      left = Math.min(left, vw - width);
      top = Math.min(top, vh - 120); // 120px minimum visible height
      left = Math.max(0, left);
      top = Math.max(0, top);
    }
  });

  function handleStart(clientX: number, clientY: number) {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    startLeft = left;
    startTop = top;
    dispatch("focus");
  }

  function handleMove(clientX: number, clientY: number) {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const playerWidth = containerEl ? containerEl.offsetWidth : width;
    const playerHeight = containerEl ? containerEl.offsetHeight : 200;
    // Clamp so the player never goes fully off-screen
    left = Math.min(Math.max(0, startLeft + dx), vw - playerWidth);
    top = Math.min(Math.max(0, startTop + dy), vh - playerHeight);
  }

  function handleEnd() {
    isDragging = false;
  }

  // Mouse Events
  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      handleStart(e.clientX, e.clientY);
      window.addEventListener("mousemove", handleMouseMoveWindow);
      window.addEventListener("mouseup", handleMouseUpWindow);
    } else {
      dispatch("focus");
    }
  }

  function handleMouseMoveWindow(e: MouseEvent) {
    handleMove(e.clientX, e.clientY);
  }

  function handleMouseUpWindow() {
    handleEnd();
    window.removeEventListener("mousemove", handleMouseMoveWindow);
    window.removeEventListener("mouseup", handleMouseUpWindow);
  }

  // Touch Events (Mobile)
  function handleTouchStart(e: TouchEvent) {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      // e.preventDefault(); // Might block scrolling, careful. But we want to drag.
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
      window.addEventListener("touchmove", handleTouchMoveWindow, {
        passive: false,
      });
      window.addEventListener("touchend", handleTouchEndWindow);
    } else {
      dispatch("focus");
    }
  }

  function handleTouchMoveWindow(e: TouchEvent) {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }

  function handleTouchEndWindow() {
    handleEnd();
    window.removeEventListener("touchmove", handleTouchMoveWindow);
    window.removeEventListener("touchend", handleTouchEndWindow);
  }

  function close() {
    dispatch("close");
  }

  function handleTimeUpdate(e: Event) {
    if (videoEl) {
      localStorage.setItem(`video-time-${video.name}`, videoEl.currentTime.toString());
    }
  }

  function handleVolumeChange(e: Event) {
    if (videoEl) {
      localStorage.setItem('video-volume', videoEl.volume.toString());
      localStorage.setItem('video-muted', videoEl.muted.toString());
    }
  }

  function selectAudioTrack(index: number) {
    if (videoEl && (videoEl as any).audioTracks) {
      const tracks = (videoEl as any).audioTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].enabled = (i === index);
      }
      showTrackMenu = false;
    }
  }

  function handleLoadedMetadata(e: Event) {
    if (typeof window === "undefined") return;

    // Restore time
    const savedTime = localStorage.getItem(`video-time-${video.name}`);
    if (savedTime && videoEl) {
      videoEl.currentTime = parseFloat(savedTime);
    }

    // Restore volume
    const savedVolume = localStorage.getItem('video-volume');
    if (savedVolume !== null && videoEl) {
      videoEl.volume = parseFloat(savedVolume);
    }
    const savedMuted = localStorage.getItem('video-muted');
    if (savedMuted !== null && videoEl) {
      videoEl.muted = savedMuted === 'true';
    }

    // Check for audio tracks
    if (videoEl && (videoEl as any).audioTracks && (videoEl as any).audioTracks.length > 1) {
      audioTracks = Array.from((videoEl as any).audioTracks);
    } else {
      audioTracks = [];
    }

    const target = e.target as HTMLVideoElement;
    const videoWidth = target.videoWidth;
    const videoHeight = target.videoHeight;
    
    if (videoHeight > videoWidth) {
      const vh = window.innerHeight;
      const headerHeight = 40; 
      const maxAvailableHeight = vh - top - headerHeight;
      const aspectRatio = videoWidth / videoHeight;
      const idealWidth = maxAvailableHeight * aspectRatio;
      
      if (idealWidth < width) {
        width = Math.max(300, idealWidth);
      }
    }
  }
</script>

<div
  bind:this={containerEl}
  class="fixed shadow-2xl rounded-lg bg-gray-900 border border-gray-700 flex flex-col overflow-hidden player-window"
  style="left: {left}px; top: {top}px; width: {width}px; z-index: {zIndex}; max-width: calc(100% - {left}px); max-height: calc(100% - {top}px);"
  on:mousedown={handleMouseDown}
  on:touchstart={handleTouchStart}
>
  <!-- Header / Drag Handle -->
  <div
    class="drag-handle bg-gray-800 p-2 cursor-move flex justify-between items-center select-none shrink-0"
  >
    <h3 class="text-white text-sm font-medium truncate px-2 max-w-[60%]">
      {video.name}
    </h3>
    <div class="flex items-center gap-2">
      {#if audioTracks.length > 1}
        <div class="relative">
          <button
            on:click|stopPropagation={() => showTrackMenu = !showTrackMenu}
            class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition"
          >
            Audio Tracks
          </button>
          {#if showTrackMenu}
            <div class="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[120px] overflow-hidden">
              {#each audioTracks as track, i}
                <button
                  on:click|stopPropagation={() => selectAudioTrack(i)}
                  class="w-full text-left px-3 py-2 text-xs text-white hover:bg-gray-700 transition {track.enabled ? 'bg-blue-600 hover:bg-blue-500' : ''}"
                >
                  {track.language || track.label || `Track ${i + 1}`}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
      <button
        on:click|stopPropagation={close}
        class="text-gray-400 hover:text-white px-2 text-lg leading-none"
      >
        &times;
      </button>
    </div>
  </div>

  <!-- Content -->
  <div
    class="relative bg-black flex-1 flex items-center justify-center min-h-0 overflow-hidden"
  >
    <video
      bind:this={videoEl}
      src={api.getStreamUrl(video.name)}
      class="w-full h-full max-w-full max-h-full object-contain"
      controls
      autoplay
      on:loadedmetadata={handleLoadedMetadata}
      on:timeupdate={handleTimeUpdate}
      on:volumechange={handleVolumeChange}
    ></video>
  </div>
</div>

<style>
  .player-window {
    min-width: 300px; /* Reduced min-width slightly for smaller phones */
    resize: both;
    overflow: hidden;
  }

  .player-window::-webkit-scrollbar {
    display: none;
  }
  .player-window {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
