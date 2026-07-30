<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '../../stores/auth';
    import { Shield, Users, FolderOpen, Check, X, Loader2, Plus, Trash2, Eye, EyeOff } from 'lucide-svelte';
    import { toast } from '../../stores/toastStore';
    import { SOCKET_URL } from '$lib/socket';
    
    let users = $state([]);
    let directories = $state([]);
    let newDirPath = $state('');
    let newDirName = $state('');
    let loading = $state(false);

    let activeTab = $state('users');
    let selectedUser = $state(null);
    let userPermissions = $state([]);

    onMount(async () => {
        if ($authStore.isAuthenticated && $authStore.user?.is_admin) {
            await Promise.all([fetchUsers(), fetchDirectories()]);
        }
    });

    async function fetchUsers() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) users = await res.json();
    }

    async function fetchDirectories() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/directories`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) directories = await res.json();
    }

    async function toggleVerify(user) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/users/${user.id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ verified: !user.verified })
        });
        if (res.ok) {
            user.verified = !user.verified;
            toast.success(`User ${user.username} ${user.verified ? 'verified' : 'unverified'}`);
        }
    }

    async function toggleAdmin(user) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/users/${user.id}/admin`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ is_admin: !user.is_admin })
        });
        if (res.ok) {
            user.is_admin = !user.is_admin;
            toast.success(`User ${user.username} admin status updated`);
        }
    }

    async function addDirectory(e) {
        e.preventDefault();
        loading = true;
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3033/api/admin/directories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newDirName, path: newDirPath })
        });
        if (res.ok) {
            const dir = await res.json();
            directories = [...directories, { ...dir, exists: true }];
            newDirName = '';
            newDirPath = '';
            toast.success('Directory added');
        } else {
            const data = await res.json();
            toast.error(data.error || 'Failed to add directory');
        }
        loading = false;
    }

    async function removeDirectory(id) {
        if (!confirm('Remove this directory?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/directories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            directories = directories.filter(d => d.id !== id);
            toast.success('Directory removed');
        }
    }

    async function loadPermissions(user) {
        selectedUser = user;
        activeTab = 'permissions';
        const token = localStorage.getItem('token');
        const res = await fetch(`${SOCKET_URL}/api/admin/users/${user.id}/permissions`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            userPermissions = await res.json();
        }
    }

    async function togglePermission(dirId) {
        const token = localStorage.getItem('token');
        const existing = userPermissions.find(p => p.directory_id === dirId);
        const isHidden = existing ? !existing.is_hidden : true; // default is visible (not hidden)
        
        const res = await fetch(`${SOCKET_URL}/api/admin/users/${selectedUser.id}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ directory_id: dirId, is_hidden: isHidden })
        });
        
        if (res.ok) {
            if (existing) existing.is_hidden = isHidden;
            else userPermissions = [...userPermissions, { directory_id: dirId, is_hidden: isHidden }];
            toast.success('Permission updated');
        }
    }
    
    function isHiddenForUser(dirId) {
        const p = userPermissions.find(p => p.directory_id === dirId);
        return p ? p.is_hidden : false;
    }
</script>

<div class="min-h-screen bg-[#050505] p-6 lg:p-12 text-gray-200">
    <div class="mx-auto max-w-6xl">
        <div class="mb-8 flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-900/30 text-cyan-400 border border-cyan-900/50">
                <Shield size={24} />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p class="text-sm text-gray-400">Manage users, directories, and permissions</p>
            </div>
        </div>

        <div class="flex gap-4 border-b border-gray-800 mb-8">
            <button 
                onclick={() => activeTab = 'users'}
                class="pb-4 px-2 font-medium transition-colors {activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200'}"
            >
                Users
            </button>
            <button 
                onclick={() => activeTab = 'directories'}
                class="pb-4 px-2 font-medium transition-colors {activeTab === 'directories' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200'}"
            >
                Directories
            </button>
            {#if selectedUser}
                <button 
                    onclick={() => activeTab = 'permissions'}
                    class="pb-4 px-2 font-medium transition-colors {activeTab === 'permissions' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200'}"
                >
                    Permissions: {selectedUser.username}
                </button>
            {/if}
        </div>

        {#if activeTab === 'users'}
            <div class="rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-900/60 text-gray-400">
                        <tr>
                            <th class="px-6 py-4 font-medium">Username</th>
                            <th class="px-6 py-4 font-medium">Joined</th>
                            <th class="px-6 py-4 font-medium">Verified</th>
                            <th class="px-6 py-4 font-medium">Role</th>
                            <th class="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        {#each users as user}
                            <tr class="hover:bg-gray-800/30 transition-colors">
                                <td class="px-6 py-4 font-medium text-gray-200">{user.username}</td>
                                <td class="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td class="px-6 py-4">
                                    <button 
                                        onclick={() => toggleVerify(user)}
                                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {user.verified ? 'bg-green-900/30 text-green-400 border border-green-900/50 hover:bg-green-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
                                    >
                                        {#if user.verified}<Check size={14}/>{:else}<X size={14}/>{/if}
                                        {user.verified ? 'Verified' : 'Pending'}
                                    </button>
                                </td>
                                <td class="px-6 py-4">
                                    <button 
                                        onclick={() => toggleAdmin(user)}
                                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {user.is_admin ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50 hover:bg-purple-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
                                    >
                                        <Shield size={12}/>
                                        {user.is_admin ? 'Admin' : 'User'}
                                    </button>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button 
                                        onclick={() => loadPermissions(user)}
                                        class="text-cyan-400 hover:text-cyan-300 font-medium"
                                    >
                                        Permissions
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else if activeTab === 'directories'}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-4">
                    {#each directories as dir}
                        <div class="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/30 p-5 hover:border-gray-700 transition">
                            <div class="flex items-start gap-4">
                                <div class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                                    <FolderOpen size={20} />
                                </div>
                                <div>
                                    <h3 class="font-medium text-gray-200">{dir.name}</h3>
                                    <p class="text-sm text-gray-500 font-mono mt-1">{dir.path}</p>
                                    {#if !dir.exists}
                                        <span class="mt-2 inline-flex items-center rounded bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-900/50">
                                            Missing on disk
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <button 
                                onclick={() => removeDirectory(dir.id)}
                                class="rounded-lg p-2 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    {/each}
                    {#if directories.length === 0}
                        <div class="rounded-xl border border-gray-800 border-dashed p-12 text-center text-gray-500">
                            No directories configured.
                        </div>
                    {/if}
                </div>

                <div class="rounded-xl border border-gray-800 bg-gray-900/50 p-6 h-fit">
                    <h3 class="text-lg font-medium text-white mb-4">Add Directory</h3>
                    <form onsubmit={addDirectory} class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                            <input 
                                type="text" 
                                bind:value={newDirName} 
                                required
                                class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                placeholder="e.g. Movies"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Absolute Path</label>
                            <input 
                                type="text" 
                                bind:value={newDirPath} 
                                required
                                class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                placeholder="/path/to/videos"
                            >
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            class="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 p-2.5 text-sm font-medium text-white hover:bg-cyan-500 transition disabled:opacity-50"
                        >
                            {#if loading}
                                <Loader2 class="h-4 w-4 animate-spin" />
                            {:else}
                                <Plus class="h-4 w-4" />
                            {/if}
                            Add Directory
                        </button>
                    </form>
                </div>
            </div>
        {:else if activeTab === 'permissions' && selectedUser}
            <div class="rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden max-w-2xl">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-900/60 text-gray-400">
                        <tr>
                            <th class="px-6 py-4 font-medium">Directory</th>
                            <th class="px-6 py-4 font-medium text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        {#each directories as dir}
                            <tr class="hover:bg-gray-800/30 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="font-medium text-gray-200">{dir.name}</div>
                                    <div class="text-xs text-gray-500 font-mono mt-0.5">{dir.path}</div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button 
                                        onclick={() => togglePermission(dir.id)}
                                        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition {isHiddenForUser(dir.id) ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900/50'}"
                                    >
                                        {#if isHiddenForUser(dir.id)}
                                            <EyeOff size={16}/> Hidden
                                        {:else}
                                            <Eye size={16}/> Visible
                                        {/if}
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
