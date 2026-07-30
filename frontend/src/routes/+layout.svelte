<script lang="ts">
	// src/routes/+layout.js
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import ConsoleLog from "../components/ConsoleLog.svelte";
	import SettingsModal from "../components/SettingsModal.svelte";
	import ToastContainer from "../components/ToastContainer.svelte";
	import MissingDirAlert from "../components/MissingDirAlert.svelte";
	import { Settings2, EyeOff, Eye, LogOut, User as UserIcon, Shield } from "lucide-svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { authStore, initAuth, logout } from "../stores/auth";
	import { onMount } from "svelte";

	let { children } = $props();
	let isSettingsOpen = $state(false);

	onMount(() => {
		initAuth();
	});

	// Route guarding
	$effect(() => {
		if (!$authStore.loading) {
			const path = $page.url.pathname;
			const isAuthRoute = path === '/login' || path === '/register';
			
			if (!$authStore.isAuthenticated && !isAuthRoute) {
				goto('/login');
			} else if ($authStore.isAuthenticated) {
				if (isAuthRoute) {
					goto('/');
				} else if (!$authStore.user?.verified && path !== '/pending-verification' && path !== '/login' && path !== '/register') {
					goto('/pending-verification');
				} else if (path === '/admin' && !$authStore.user?.is_admin) {
					goto('/');
				}
			}
		}
	});

	function openSettings() {
		// console.log("[settings-debug] layout: settings button clicked");
		isSettingsOpen = true;
	}

	function closeSettings() {
		// console.log("[settings-debug] layout: close callback received");
		isSettingsOpen = false;
	}

	function toggleHiddenView() {
		const isHidden = $page.url.searchParams.get("hidden") === "true";
		if (isHidden) {
			const url = new URL($page.url);
			url.searchParams.delete("hidden");
			goto(url.pathname + url.search);
		} else {
			const url = new URL($page.url);
			url.searchParams.set("hidden", "true");
			goto(url.pathname + url.search);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="fixed right-4 top-4 z-40 flex items-center gap-2">
	{#if $authStore.isAuthenticated && $authStore.user?.verified}
		{#if $authStore.user?.is_admin}
			<button
				class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/90 text-gray-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300"
				onclick={() => goto('/admin')}
				aria-label="Admin Dashboard"
			>
				<Shield size={18} />
			</button>
		{/if}

		<button
			class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/90 text-gray-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300"
			onclick={toggleHiddenView}
			aria-label={$page.url.searchParams.get("hidden") === "true" ? "Show Gallery" : "Hidden Folder"}
		>
			{#if $page.url.searchParams.get("hidden") === "true"}
				<Eye size={18} />
			{:else}
				<EyeOff size={18} />
			{/if}
		</button>

		<button
			class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/90 text-gray-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300"
			onclick={openSettings}
			aria-label="Open settings"
		>
			<Settings2 size={18} />
		</button>
		
		<button
			class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-700/50 bg-gray-900/90 text-red-400 shadow-lg shadow-black/30 backdrop-blur transition hover:border-red-400 hover:text-red-300"
			onclick={logout}
			aria-label="Logout"
		>
			<LogOut size={18} />
		</button>
	{/if}
</div>

{#if $authStore.loading}
	<div class="flex h-screen w-screen items-center justify-center bg-[#0a0a0c]">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
	</div>
{:else}
	{@render children()}
{/if}

<SettingsModal
	isOpen={isSettingsOpen}
	onClose={closeSettings}
/>
<ConsoleLog />
<ToastContainer />
<MissingDirAlert />
