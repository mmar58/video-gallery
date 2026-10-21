<script lang="ts">
	// src/routes/+layout.js
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import ConsoleLog from "../components/ConsoleLog.svelte";
	import SettingsModal from "../components/SettingsModal.svelte";
	import ToastContainer from "../components/ToastContainer.svelte";
	import MissingDirAlert from "../components/MissingDirAlert.svelte";
	import DialogHost from "../components/DialogHost.svelte";
	import VideoActionSheet from "../components/VideoActionSheet.svelte";
	import {
		Settings2,
		EyeOff,
		Eye,
		LogOut,
		Shield,
		EllipsisVertical,
		LayoutGrid,
		Clock,
		Tag,
		Upload,
	} from "lucide-svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { authStore, initAuth, logout } from "../stores/auth";
	import { isMobile } from "../lib/device";
	import { onMount } from "svelte";

	let { children } = $props();
	let isSettingsOpen = $state(false);
	let isMenuOpen = $state(false);

	// Phone chrome only for signed-in, verified users.
	const showChrome = $derived(
		$authStore.isAuthenticated && !!$authStore.user?.verified,
	);
	const showMobileChrome = $derived(showChrome && $isMobile);

	$effect(() => {
		if (typeof document === "undefined") return;
		document.body.classList.toggle("has-bottom-nav", showMobileChrome);
		return () => document.body.classList.remove("has-bottom-nav");
	});

	const navItems = [
		{ href: `${base}/`, label: "Gallery", icon: LayoutGrid, match: "/" },
		{ href: `${base}/timeline/`, label: "Timeline", icon: Clock, match: "/timeline" },
		{ href: `${base}/tags/`, label: "Tags", icon: Tag, match: "/tags" },
		{ href: `${base}/upload/`, label: "Upload", icon: Upload, match: "/upload" },
	];

	function isActive(match: string) {
		const path = $page.url.pathname.replace(/\/$/, "") || "/";
		return match === "/" ? path === "/" : path.startsWith(match);
	}

	onMount(() => {
		initAuth();
	});

	// Route guarding
	$effect(() => {
		if (!$authStore.loading) {
			const path = $page.url.pathname.replace(/\/$/, '') || '/';
			const isAuthRoute = path === '/login' || path === '/register';
			
			if (!$authStore.isAuthenticated && !isAuthRoute) {
				goto('/login/');
			} else if ($authStore.isAuthenticated) {
				if (isAuthRoute) {
					goto('/');
				} else if (!$authStore.user?.verified && path !== '/pending-verification' && path !== '/login' && path !== '/register') {
					goto('/pending-verification/');
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

<div class="fixed right-4 top-4 z-40 {$isMobile ? 'hidden' : 'hidden md:flex'} items-center gap-2">
	{#if showChrome}
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

<!-- Phone top bar -->
{#if showMobileChrome}
	<header
		class="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-gray-800 bg-gray-900/95 px-3"
		style="padding-top: env(safe-area-inset-top, 0px); box-sizing: content-box;"
	>
		<a
			href="{base}/"
			class="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent"
		>
			Video Gallery
		</a>
		<div class="flex items-center gap-1">
			<button
				class="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-200 active:bg-gray-800"
				onclick={toggleHiddenView}
				aria-label={$page.url.searchParams.get("hidden") === "true" ? "Show Gallery" : "Hidden Folder"}
			>
				{#if $page.url.searchParams.get("hidden") === "true"}
					<Eye size={20} />
				{:else}
					<EyeOff size={20} />
				{/if}
			</button>
			<button
				class="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-200 active:bg-gray-800"
				onclick={openSettings}
				aria-label="Open settings"
			>
				<Settings2 size={20} />
			</button>
			<div class="relative">
				<button
					class="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-200 active:bg-gray-800"
					onclick={() => (isMenuOpen = !isMenuOpen)}
					aria-label="More"
					aria-expanded={isMenuOpen}
				>
					<EllipsisVertical size={20} />
				</button>
				{#if isMenuOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="fixed inset-0 z-40" onclick={() => (isMenuOpen = false)}></div>
					<div
						class="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-2xl"
					>
						{#if $authStore.user?.is_admin}
							<button
								class="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm text-gray-200 active:bg-gray-800"
								onclick={() => {
									isMenuOpen = false;
									goto('/admin');
								}}
							>
								<Shield size={18} /> Admin dashboard
							</button>
						{/if}
						<button
							class="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm text-red-400 active:bg-gray-800"
							onclick={() => {
								isMenuOpen = false;
								logout();
							}}
						>
							<LogOut size={18} /> Log out
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>
{/if}

{#if $authStore.loading}
	<div class="flex h-screen w-screen items-center justify-center bg-[#0a0a0c]">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
	</div>
{:else}
	{@render children()}
{/if}

<!-- Phone bottom tab bar -->
{#if showMobileChrome}
	<nav
		class="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-800 bg-gray-900/95"
		style="height: calc(3.5rem + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px);"
		aria-label="Primary"
	>
		{#each navItems as item}
			{@const active = isActive(item.match)}
			<a
				href={item.href}
				class="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors {active
					? 'text-red-400'
					: 'text-gray-400 active:text-gray-200'}"
				aria-current={active ? "page" : undefined}
			>
				<item.icon size={22} />
				{item.label}
			</a>
		{/each}
	</nav>
{/if}

<SettingsModal
	isOpen={isSettingsOpen}
	onClose={closeSettings}
/>
<ConsoleLog />
<ToastContainer />
<MissingDirAlert />
<VideoActionSheet />
<DialogHost />
