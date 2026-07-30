<script lang="ts">
    import { authStore, logout } from '../../stores/auth';
    import { goto } from '$app/navigation';
    import { ShieldAlert, LogOut } from 'lucide-svelte';

    // If somehow they get verified while here, redirect them
    $effect(() => {
        if ($authStore.isAuthenticated && $authStore.user?.verified) {
            goto('/');
        }
    });
</script>

<div class="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
    <!-- Abstract Background -->
    <div class="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-orange-900/20 blur-[120px]"></div>

    <div class="relative w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950/50 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div class="mb-6 flex justify-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <ShieldAlert class="h-10 w-10" />
            </div>
        </div>
        
        <h1 class="text-2xl font-bold tracking-tight text-white mb-2">Account Pending Verification</h1>
        <p class="text-gray-400 mb-8 leading-relaxed">
            Your account has been created successfully, but it needs to be approved by an administrator before you can access the gallery.
        </p>

        <button
            onclick={logout}
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900/50 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
            <LogOut class="h-4 w-4" />
            Sign out for now
        </button>
    </div>
</div>
