<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '../stores/auth';
    import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    import { toast } from '../stores/toastStore';
    import { SOCKET_URL } from '$lib/socket';

    let missingDirs = $state([]);
    let show = $state(false);
    let loading = $state(false);
    let checking = $state(false);

    onMount(async () => {
        if ($authStore.isAuthenticated && $authStore.user?.is_admin) {
            checkMissingDirs();
            // Check periodically
            setInterval(checkMissingDirs, 60000);
        }
    });

    async function checkMissingDirs() {
        if (checking) return;
        checking = true;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${SOCKET_URL}/api/admin/scan-missing`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.missing && data.missing.length > 0) {
                    missingDirs = data.missing;
                    show = true;
                } else {
                    missingDirs = [];
                    show = false;
                }
            }
        } catch (error) {
            console.error('Failed to scan directories:', error);
        }
        checking = false;
    }

    async function cleanupDir(dir) {
        if (!confirm(`Are you sure you want to remove all database records for directory '${dir.name}'? This cannot be undone.`)) return;
        
        loading = true;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${SOCKET_URL}/api/admin/directories/${dir.id}/cleanup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success(`Cleaned up data for ${dir.name}`);
                missingDirs = missingDirs.filter(d => d.id !== dir.id);
                if (missingDirs.length === 0) show = false;
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to cleanup directory');
            }
        } catch (error) {
            toast.error('Network error during cleanup');
        }
        loading = false;
    }
</script>

{#if show && missingDirs.length > 0}
    <div 
        class="fixed bottom-6 right-6 z-[9000] w-96 rounded-xl border border-red-900/50 bg-gray-950/95 p-5 shadow-2xl backdrop-blur-xl"
        transition:fly={{ y: 50, duration: 300 }}
    >
        <button 
            onclick={() => show = false}
            class="absolute right-3 top-3 text-gray-400 hover:text-white transition"
        >
            <X size={18} />
        </button>
        
        <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={20} />
            </div>
            <div class="flex-1">
                <h3 class="text-sm font-semibold text-white">Missing Root Directory</h3>
                <p class="mt-1 text-xs text-gray-400 leading-relaxed">
                    The following directories could not be found on disk. Do you want to clean up their associated data?
                </p>
                
                <div class="mt-4 space-y-3">
                    {#each missingDirs as dir}
                        <div class="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-xs font-medium text-gray-200">{dir.name}</p>
                                <p class="truncate text-[10px] text-gray-500">{dir.path}</p>
                            </div>
                            <button
                                onclick={() => cleanupDir(dir)}
                                disabled={loading}
                                class="flex shrink-0 items-center justify-center rounded-md bg-red-950 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900 hover:text-white transition disabled:opacity-50"
                            >
                                {#if loading}
                                    <Loader2 class="h-3 w-3 animate-spin" />
                                {:else}
                                    <Trash2 class="mr-1.5 h-3 w-3" />
                                    Clear
                                {/if}
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}
