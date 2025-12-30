<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { api } from "../lib/api";

  export let video;
  export let zIndex = 100;

  const dispatch = createEventDispatcher();
  let videoEl;
  let containerEl;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

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
        top = 60 + Math.random() * 20; // Slight offset
      } else {
        width = 640;
        left = 100 + Math.random() * 50;
        top = 100 + Math.random() * 50;
      }
    }
  });

  function handleStart(clientX, clientY) {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    startLeft = left;
    startTop = top;
    dispatch("focus");
  }

  function handleMove(clientX, clientY) {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    left = startLeft + dx;
    top = startTop + dy;
  }

  function handleEnd() {
    isDragging = false;
  }

  // Mouse Events
  function handleMouseDown(e) {
    if (e.target.closest(".drag-handle")) {
      handleStart(e.clientX, e.clientY);
      window.addEventListener("mousemove", handleMouseMoveWindow);
      window.addEventListener("mouseup", handleMouseUpWindow);
    } else {
      dispatch("focus");
    }
  }

  function handleMouseMoveWindow(e) {
    handleMove(e.clientX, e.clientY);
  }

  function handleMouseUpWindow() {
    handleEnd();
    window.removeEventListener("mousemove", handleMouseMoveWindow);
    window.removeEventListener("mouseup", handleMouseUpWindow);
  }

  // Touch Events (Mobile)
  function handleTouchStart(e) {
    if (e.target.closest(".drag-handle")) {
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

  function handleTouchMoveWindow(e) {
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
</script>

<div
  bind:this={containerEl}
  class="fixed shadow-2xl rounded-lg bg-gray-900 border border-gray-700 flex flex-col overflow-hidden player-window"
  style="left: {left}px; top: {top}px; width: {width}px; z-index: {zIndex};"
  on:mousedown={handleMouseDown}
  on:touchstart={handleTouchStart}
>
  <!-- Header / Drag Handle -->
  <div
    class="drag-handle bg-gray-800 p-2 cursor-move flex justify-between items-center select-none"
  >
    <h3 class="text-white text-sm font-medium truncate px-2 max-w-[80%]">
      {video.name}
    </h3>
    <button
      on:click|stopPropagation={close}
      class="text-gray-400 hover:text-white px-2 text-lg leading-none"
    >
      &times;
    </button>
  </div>

  <!-- Content -->
  <div
    class="relative bg-black flex-1 flex items-center justify-center min-h-0"
  >
    <video
      bind:this={videoEl}
      src={api.getStreamUrl(video.name)}
      class="w-full h-full object-contain"
      controls
      autoplay
    ></video>
  </div>
</div>

<style>
  .player-window {
    min-width: 300px; /* Reduced min-width slightly for smaller phones */
    resize: both;
    overflow: auto;
  }

  .player-window::-webkit-scrollbar {
    display: none;
  }
  .player-window {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
