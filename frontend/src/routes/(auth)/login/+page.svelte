<script lang="ts">
    import { login } from '../../../stores/auth';
    import { goto } from '$app/navigation';
    import { Film, User, Lock, ArrowRight, Loader2 } from 'lucide-svelte';

    let username = $state('');
    let password = $state('');
    let loading = $state(false);
    let errorMsg = $state('');

    async function handleLogin(e: Event) {
        e.preventDefault();
        loading = true;
        errorMsg = '';
        
        const res = await login(username, password);
        if (res.success) {
            goto('/');
        } else {
            errorMsg = res.error || 'Login failed';
        }
        loading = false;
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
    <!-- Abstract Background -->
    <div class="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-900/20 blur-[120px]"></div>
    <div class="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[120px]"></div>

    <div class="relative w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950/50 p-8 shadow-2xl backdrop-blur-xl">
        <div class="mb-8 flex flex-col items-center text-center">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Film class="h-8 w-8 text-white" />
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p class="mt-2 text-sm text-gray-400">Enter your credentials to access the gallery</p>
        </div>

        {#if errorMsg}
            <div class="mb-6 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-sm text-red-400 backdrop-blur-sm transition-all">
                {errorMsg}
            </div>
        {/if}

        <form onsubmit={handleLogin} class="space-y-5">
            <div class="space-y-1">
                <label for="username" class="text-sm font-medium text-gray-300">Username</label>
                <div class="relative">
                    <User class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                        id="username"
                        type="text"
                        bind:value={username}
                        required
                        class="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        placeholder="admin"
                    />
                </div>
            </div>

            <div class="space-y-1">
                <label for="password" class="text-sm font-medium text-gray-300">Password</label>
                <div class="relative">
                    <Lock class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                        id="password"
                        type="password"
                        bind:value={password}
                        required
                        class="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                class="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-70"
            >
                {#if loading}
                    <Loader2 class="h-5 w-5 animate-spin" />
                    Signing in...
                {:else}
                    Sign in
                    <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
                {/if}
            </button>
        </form>

        <p class="mt-8 text-center text-sm text-gray-400">
            Don't have an account? 
            <a href="/register" class="font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">Sign up</a>
        </p>
    </div>
</div>
