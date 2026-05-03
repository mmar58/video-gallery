<script lang="ts">
	// src/routes/+layout.js
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import ConsoleLog from "../components/ConsoleLog.svelte";
	import SettingsModal from "../components/SettingsModal.svelte";
	import ToastContainer from "../components/ToastContainer.svelte";
	import { Settings2 } from "lucide-svelte";

	let { children } = $props();
	let isSettingsOpen = $state(false);

	function openSettings() {
		// console.log("[settings-debug] layout: settings button clicked");
		isSettingsOpen = true;
	}

	function closeSettings() {
		// console.log("[settings-debug] layout: close callback received");
		isSettingsOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<button
	class="fixed right-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/90 text-gray-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300"
	onclick={openSettings}
	aria-label="Open settings"
>
	<Settings2 size={18} />
</button>

{@render children()}

<SettingsModal
	isOpen={isSettingsOpen}
	onClose={closeSettings}
/>
<ConsoleLog />
<ToastContainer />
