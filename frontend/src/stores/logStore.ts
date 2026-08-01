import { writable } from 'svelte/store';

export interface Log {
    message: string;
    type: string;
    timestamp: Date;
}

function createLogStore() {
    const { subscribe, update, set } = writable<Log[]>([]);

    return {
        subscribe,
        add: (message: string, type: string = 'info') => update(logs => {
            const newLog: Log = { message, type, timestamp: new Date() };
            return [...logs, newLog].slice(-100); // Keep last 100
        }),
        clear: () => set([])
    };
}

export const logStore = createLogStore();
