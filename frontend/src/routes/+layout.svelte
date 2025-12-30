<script lang="ts">
	// src/routes/+layout.js
	export const prerender = true;
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import ConsoleLog from "../components/ConsoleLog.svelte";
	import ToastContainer from "../components/ToastContainer.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ConsoleLog />
<ToastContainer />
