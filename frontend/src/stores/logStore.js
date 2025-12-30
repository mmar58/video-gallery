import { writable } from 'svelte/store';

function createLogStore() {
    const { subscribe, update, set } = writable([]);

    return {
        subscribe,
        add: (message, type = 'info') => update(logs => {
            const newLog = { message, type, timestamp: new Date() };
            return [...logs, newLog].slice(-100); // Keep last 100
        }),
        clear: () => set([])
    };
}

export const logStore = createLogStore();
