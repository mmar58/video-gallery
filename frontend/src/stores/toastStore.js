import { writable } from 'svelte/store';

function createToastStore() {
    const { subscribe, update } = writable([]);

    return {
        subscribe,
        success: (msg, duration = 3000) => addToast(msg, 'success', duration),
        error: (msg, duration = 3000) => addToast(msg, 'error', duration),
        info: (msg, duration = 3000) => addToast(msg, 'info', duration),
        warning: (msg, duration = 3000) => addToast(msg, 'warning', duration),
        remove: (id) => update(n => n.filter(t => t.id !== id))
    };

    function addToast(message, type, duration) {
        const id = Math.random().toString(36).substr(2, 9);
        update(n => [...n, { id, message, type }]);
        if (duration) {
            setTimeout(() => {
                update(n => n.filter(t => t.id !== id));
            }, duration);
        }
    }
}

export const toast = createToastStore();
