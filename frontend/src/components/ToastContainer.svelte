<script>
    import { toast } from "../stores/toastStore";
    import {
        X,
        CheckCircle,
        AlertCircle,
        Info,
        AlertTriangle,
    } from "lucide-svelte";
    import { fly } from "svelte/transition";

    function getIcon(type) {
        switch (type) {
            case "success":
                return CheckCircle;
            case "error":
                return AlertCircle;
            case "warning":
                return AlertTriangle;
            default:
                return Info;
        }
    }

    function getColor(type) {
        switch (type) {
            case "success":
                return "bg-green-600 text-white";
            case "error":
                return "bg-red-600 text-white";
            case "warning":
                return "bg-yellow-500 text-black";
            default:
                return "bg-blue-600 text-white";
        }
    }
</script>

<div
    class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
>
    {#each $toast as t (t.id)}
        <div
            class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded shadow-lg min-w-[300px] {getColor(
                t.type,
            )}"
            transition:fly={{ x: 300, duration: 300 }}
        >
            <svelte:component this={getIcon(t.type)} size={20} />
            <p class="flex-1 text-sm font-medium">{t.message}</p>
            <button
                class="opacity-70 hover:opacity-100 transition"
                on:click={() => toast.remove(t.id)}
            >
                <X size={18} />
            </button>
        </div>
    {/each}
</div>
