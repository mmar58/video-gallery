<script>
  import { createEventDispatcher } from "svelte";
  import { api } from "../lib/api";

  export let video;
  export let zIndex = 100;

  const dispatch = createEventDispatcher();
  let videoEl;
  let containerEl;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

  // Initial position (center-ish)
  let left = 100 + Math.random() * 50;
  let top = 100 + Math.random() * 50;

  function handleMouseDown(e) {
    // Only trigger drag if clicking header/title area
    if (e.target.closest(".drag-handle")) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = left;
      startTop = top;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      dispatch("focus"); // Bring to front
    } else {
      dispatch("focus");
    }
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    left = startLeft + dx;
    top = startTop + dy;
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  function close() {
    dispatch("close");
  }
</script>

<div
  bind:this={containerEl}
  class="fixed shadow-2xl rounded-lg bg-gray-900 border border-gray-700 flex flex-col overflow-hidden resize-both"
  style="left: {left}px; top: {top}px; width: 640px; z-index: {zIndex}; resize: both; overflow: auto; min-width: 320px;"
  on:mousedown={handleMouseDown}
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
  /* Hide scrollbars for the resize container */
  .resize-both::-webkit-scrollbar {
    display: none;
  }
  .resize-both {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
