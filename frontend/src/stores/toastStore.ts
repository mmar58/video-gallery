import { writable } from 'svelte/store';

export interface Toast {
    id: string;
    message: string;
    type: string;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    function addToast(message: string, type: string, duration?: number) {
        const id = Math.random().toString(36).substr(2, 9);
        update(n => [...n, { id, message, type }]);
        if (duration) {
            setTimeout(() => {
                update(n => n.filter(t => t.id !== id));
            }, duration);
        }
    }

    return {
        subscribe,
        success: (msg: string, duration: number = 3000) => addToast(msg, 'success', duration),
        error: (msg: string, duration: number = 3000) => addToast(msg, 'error', duration),
        info: (msg: string, duration: number = 3000) => addToast(msg, 'info', duration),
        warning: (msg: string, duration: number = 3000) => addToast(msg, 'warning', duration),
        remove: (id: string) => update(n => n.filter(t => t.id !== id))
    };
}

export const toast = createToastStore();
