<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { ChevronDown, ChevronUp, Play, Pause, X, Maximize, Minimize } from "lucide-svelte";
  import { api } from "../lib/api";
  import { isMobile } from "../lib/device";
  import { mobilePlayerId } from "../stores/uiStore";

  export let video: any;
  export let zIndex: number = 100;

  const dispatch = createEventDispatcher();
  const myId = Date.now() + Math.random();
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

  // Phone mode: docked at the top of the screen, or minimized into a mini player bar.
  let minimized = false;
  let paused = false;
  let dockHeight = 0;
  let mounted = false;

  // Fullscreen tracking & layout lock:
  // When a video is in fullscreen, rotating the phone (portrait <-> landscape) must
  // NEVER unmount the <video> element. We lock isPhoneMode while in fullscreen so
  // Svelte doesn't swap branches or tear down the media element during orientation change.
  let isFullscreen = false;
  let isPhoneMode = false;

  function checkFullscreen(): boolean {
    if (typeof document === "undefined") return false;
    const docFs = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    const videoFs = !!(videoEl && ((videoEl as any).webkitDisplayingFullscreen || (videoEl as any).webkitCurrentPlaybackTargetIsWireless));
    return docFs || videoFs;
  }

  function handleFullscreenChange() {
    const wasFullscreen = isFullscreen;
    isFullscreen = checkFullscreen();
    if (wasFullscreen && !isFullscreen) {
      isPhoneMode = $isMobile;
    }
  }

  // Only update isPhoneMode when NOT in fullscreen
  $: if (!isFullscreen) {
    isPhoneMode = $isMobile;
  }

  function toggleFullscreen() {
    if (!videoEl) return;
    if (checkFullscreen()) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((videoEl as any).webkitExitFullscreen) {
        (videoEl as any).webkitExitFullscreen();
      }
    } else {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen().catch(() => {
          if ((videoEl as any).webkitEnterFullscreen) {
            (videoEl as any).webkitEnterFullscreen();
          }
        });
      } else if ((videoEl as any).webkitEnterFullscreen) {
        (videoEl as any).webkitEnterFullscreen();
      } else if ((videoEl as any).webkitRequestFullscreen) {
        (videoEl as any).webkitRequestFullscreen();
      }
    }
  }

  onMount(() => {
    mounted = true;
    isPhoneMode = $isMobile;
    if (typeof window !== "undefined") {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Responsive width: 90% on mobile, max 640px default
      if ($isMobile) {
        width = Math.min(vw * 0.9, 640);
        left = (vw - width) / 2;
        top = 60 + Math.random() * 20;
        mobilePlayerId.set(myId);
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

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    }
  });

  // One player at a time on phones (never close while user is watching in fullscreen).
  $: if (mounted && !isFullscreen && $isMobile && $mobilePlayerId !== null && $mobilePlayerId !== myId) {
    dispatch("close");
  }

  // Reserve space under the docked player so page content isn't hidden behind it,
  // and flag the mini player so floating elements can lift above it.
  $: if (typeof document !== "undefined") applyDock(isPhoneMode, minimized, dockHeight);

  function applyDock(mobile: boolean, isMin: boolean, height: number) {
    if (!mobile || isFullscreen) return;
    document.body.dataset.playerOwner = String(myId);
    document.body.style.paddingTop = !isMin && height ? `${height}px` : "";
    document.body.classList.toggle("mini-player", isMin);
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);

      if (document.body.dataset.playerOwner === String(myId)) {
        document.body.style.paddingTop = "";
        document.body.classList.remove("mini-player");
        delete document.body.dataset.playerOwner;
      }
    }
    mobilePlayerId.update((id) => (id === myId ? null : id));
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

  function togglePlay() {
    if (!videoEl) return;
    if (videoEl.paused) videoEl.play().catch(() => {});
    else videoEl.pause();
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

    // Desktop floating window only: shrink the window for portrait videos.
    if (isPhoneMode) return;
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

{#if isPhoneMode}
  <!-- Phone player: docked full-width at the top, or minimized to a bar above the tab bar -->
  <div
    bind:clientHeight={dockHeight}
    class="fixed left-0 right-0 flex bg-gray-900 shadow-2xl {minimized
      ? 'mini-player-bar above-bottom-nav mx-2 h-16 flex-row items-center overflow-hidden rounded-xl border border-gray-700'
      : 'top-0 flex-col border-b border-gray-800'}"
    style="z-index: {zIndex}; {minimized ? '' : 'padding-top: env(safe-area-inset-top, 0px);'}"
  >
    {#if !minimized}
      <div class="flex h-11 shrink-0 items-center justify-between bg-gray-800 pl-3 pr-1">
        <h3 class="min-w-0 flex-1 truncate pr-2 text-sm font-medium text-white">
          {video.name}
        </h3>
        <div class="flex items-center">
          {#if audioTracks.length > 1}
            <div class="relative">
              <button
                on:click|stopPropagation={() => showTrackMenu = !showTrackMenu}
                class="mr-1 rounded bg-gray-700 px-2.5 py-2 text-xs text-white active:bg-gray-600"
              >
                Audio
              </button>
              {#if showTrackMenu}
                <div class="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded border border-gray-700 bg-gray-800 shadow-lg">
                  {#each audioTracks as track, i}
                    <button
                      on:click|stopPropagation={() => selectAudioTrack(i)}
                      class="w-full px-3 py-3 text-left text-xs text-white active:bg-gray-700 {track.enabled ? 'bg-blue-600' : ''}"
                    >
                      {track.language || track.label || `Track ${i + 1}`}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
          <button
            on:click={toggleFullscreen}
            class="flex h-11 w-11 items-center justify-center text-gray-300 active:text-white"
            aria-label={isFullscreen ? "Exit fullscreen" : "Full screen"}
          >
            {#if isFullscreen}
              <Minimize size={20} />
            {:else}
              <Maximize size={20} />
            {/if}
          </button>
          <button
            on:click={() => (minimized = true)}
            class="flex h-11 w-11 items-center justify-center text-gray-300 active:text-white"
            aria-label="Minimize player"
          >
            <ChevronDown size={22} />
          </button>
          <button
            on:click={close}
            class="flex h-11 w-11 items-center justify-center text-gray-300 active:text-white"
            aria-label="Close player"
          >
            <X size={22} />
          </button>
        </div>
      </div>
    {/if}

    <!-- Same <video> element in both modes, so minimizing never interrupts playback -->
    <div
      class="bg-black {minimized ? 'h-full w-28 shrink-0' : 'w-full'}"
      style={minimized ? '' : 'aspect-ratio: 16 / 9; max-height: 60dvh;'}
    >
      <video
        bind:this={videoEl}
        bind:paused
        src={api.getStreamUrl(video.name)}
        class="h-full w-full object-contain"
        controls={!minimized}
        autoplay
        playsinline
        webkit-playsinline
        on:webkitbeginfullscreen={() => { isFullscreen = true; }}
        on:webkitendfullscreen={() => { isFullscreen = false; isPhoneMode = $isMobile; }}
        on:loadedmetadata={handleLoadedMetadata}
        on:timeupdate={handleTimeUpdate}
        on:volumechange={handleVolumeChange}
      ></video>
    </div>

    {#if minimized}
      <button
        class="min-w-0 flex-1 truncate px-3 text-left text-sm font-medium text-white"
        on:click={() => (minimized = false)}
        aria-label="Expand player"
      >
        {video.name}
      </button>
      <button
        on:click={togglePlay}
        class="flex h-12 w-11 shrink-0 items-center justify-center text-white active:text-gray-300"
        aria-label={paused ? "Play" : "Pause"}
      >
        {#if paused}<Play size={22} class="fill-white" />{:else}<Pause size={22} class="fill-white" />{/if}
      </button>
      <button
        on:click={() => (minimized = false)}
        class="flex h-12 w-10 shrink-0 items-center justify-center text-gray-300 active:text-white"
        aria-label="Expand player"
      >
        <ChevronUp size={22} />
      </button>
      <button
        on:click={close}
        class="flex h-12 w-11 shrink-0 items-center justify-center text-gray-300 active:text-white"
        aria-label="Close player"
      >
        <X size={20} />
      </button>
    {/if}
  </div>
{:else}
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
          on:click|stopPropagation={toggleFullscreen}
          class="p-1 text-gray-400 hover:text-white transition"
          aria-label={isFullscreen ? "Exit fullscreen" : "Full screen"}
        >
          {#if isFullscreen}
            <Minimize size={16} />
          {:else}
            <Maximize size={16} />
          {/if}
        </button>
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
        playsinline
        webkit-playsinline
        on:webkitbeginfullscreen={() => { isFullscreen = true; }}
        on:webkitendfullscreen={() => { isFullscreen = false; isPhoneMode = $isMobile; }}
        on:loadedmetadata={handleLoadedMetadata}
        on:timeupdate={handleTimeUpdate}
        on:volumechange={handleVolumeChange}
      ></video>
    </div>
  </div>
{/if}

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
