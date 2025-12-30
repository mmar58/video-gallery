<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '../lib/api';

  export let video; // Filename

  const dispatch = createEventDispatcher();
  let videoEl;

  function close() {
    dispatch('close');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoEl.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  // Close on Escape key
  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm" on:click={close}>
  <!-- Stop propagation to prevent closing when clicking the player controls -->
  <div class="relative w-full max-w-6xl p-4" on:click|stopPropagation>
     <!-- Close Button -->
    <button 
      class="absolute -top-10 right-4 text-white hover:text-red-500 text-2xl font-bold" 
      on:click={close}
    >
      &times; Close
    </button>

    <video 
      bind:this={videoEl}
      src={api.getStreamUrl(video.name)} 
      class="w-full h-auto rounded-lg shadow-2xl" 
      controls 
      autoplay
    ></video>
    
    <h2 class="text-white text-xl mt-4 text-center">{video.name}</h2>
  </div>
</div>
