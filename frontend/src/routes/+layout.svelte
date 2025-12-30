<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import ConsoleLog from "../components/ConsoleLog.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ConsoleLog />
