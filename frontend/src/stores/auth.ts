import { writable } from 'svelte/store';
import { api } from '$lib/api';
import { SOCKET_URL } from '$lib/socket';

export interface User {
    username: string;
    // add other fields if known, or leave as any
    [key: string]: any;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
}

export const authStore = writable<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
});

export const initAuth = async (): Promise<void> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        try {
            // Check me endpoint
            const res = await fetch(`${SOCKET_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const user = await res.json();
                authStore.set({ isAuthenticated: true, user, loading: false });
            } else {
                localStorage.removeItem('token');
                authStore.set({ isAuthenticated: false, user: null, loading: false });
            }
        } catch (error) {
            authStore.set({ isAuthenticated: false, user: null, loading: false });
        }
    } else {
        authStore.set({ isAuthenticated: false, user: null, loading: false });
    }
};

export const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`${SOCKET_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('token', data.token);
        authStore.set({ isAuthenticated: true, user: data.user, loading: false });
        return { success: true };
    }
    return { success: false, error: data.error };
};

export const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`${SOCKET_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        return { success: true };
    }
    return { success: false, error: data.error };
};

export const logout = (): void => {
    localStorage.removeItem('token');
    authStore.set({ isAuthenticated: false, user: null, loading: false });
};
