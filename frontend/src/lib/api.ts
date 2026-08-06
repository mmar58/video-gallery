import { SOCKET_URL } from "./socket";

const API_URL = `${SOCKET_URL}/api/videos`;

const getAuthToken = (): string | null => typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();
    const headers = token ? { ...options.headers, 'Authorization': `Bearer ${token}` } : options.headers as HeadersInit;
    // console.trace("Url called", url)
    return window.fetch(url, { ...options, headers });
};

export const api = {
    async fetchVideos(search: string = '', sort: string = 'name', page: number = 1, limit: number = 12, tag: string = '', days: string | number = '', dateFrom: string = '', dateTo: string = '', hidden: boolean = false): Promise<any> {
        let query = `${API_URL}?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}&limit=${limit}&tag=${encodeURIComponent(tag)}`;
        if (days) query += `&days=${days}`;
        if (dateFrom) query += `&dateFrom=${dateFrom}`;
        if (dateTo) query += `&dateTo=${dateTo}`;
        if (hidden) query += `&hidden=true`;

        const res = await fetchWithAuth(query);
        return await res.json();
    },

    async fetchStats(): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/stats`);
        return await res.json();
    },

    async fetchBlacklist(): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist`);
        return await res.json();
    },

    async fetchOllamaSettings(): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: fetchOllamaSettings request', `${baseUrl}/api/settings/ollama`);
        const res = await fetchWithAuth(`${baseUrl}/api/settings/ollama`);
        if (!res.ok) throw new Error('Failed to fetch Ollama settings');
        const data = await res.json();
        console.log('[settings-debug] api: fetchOllamaSettings success', data);
        return data;
    },

    async saveOllamaSettings(settings: any): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: saveOllamaSettings request', settings);
        const res = await fetchWithAuth(`${baseUrl}/api/settings/ollama`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to save Ollama settings');
        }
        const data = await res.json();
        console.log('[settings-debug] api: saveOllamaSettings success', data);
        return data;
    },

    async fetchGeneralSettings(): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/settings/general`);
        if (!res.ok) throw new Error('Failed to fetch general settings');
        return await res.json();
    },

    async saveGeneralSettings(settings: any): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/settings/general`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!res.ok) throw new Error('Failed to save general settings');
        return await res.json();
    },

    async blacklistWord(word: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word }),
        });
        return res.json();
    },

    async removeBlacklistWord(word: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist/${word}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // --- Tags ---
    async fetchTags(): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/tags`);
        return res.json();
    },

    async fetchTagsWithStats(): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/tags`);
        return res.json();
    },

    async renameTag(oldTag: string, newName: string): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/tags/${encodeURIComponent(oldTag)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName })
        });
        return res.json();
    },

    async deleteTag(tag: string): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/tags/${encodeURIComponent(tag)}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async blacklistTag(tag: string): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/tags/${encodeURIComponent(tag)}/blacklist`, {
            method: 'POST'
        });
        return res.json();
    },

    async getModels(): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: getModels request', `${baseUrl}/api/ollama/models`);
        const res = await fetchWithAuth(`${baseUrl}/api/ollama/models`);
        if (!res.ok) throw new Error('Failed to fetch Ollama models');
        const data = await res.json();
        console.log('[settings-debug] api: getModels success count', Array.isArray(data) ? data.length : 0);
        return data;
    },

    async uploadVideo(formData: FormData, onProgress?: (percent: number) => void): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${baseUrl}/api/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Upload failed'));

            xhr.send(formData);
        });
    },

    async addTag(filename: string, tag: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag })
        });
        return await res.json();
    },

    async regenerateTags(filename: string, modelName: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/regenerate-tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelName })
        });
        return await res.json();
    },

    async removeTag(filename: string, tag: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/tags/${tag}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    async likeVideo(filename: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/like`, { method: 'POST' });
        return await res.json();
    },

    async hideVideo(filename: string, days: number | string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/hide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: Number(days) })
        });
        return await res.json();
    },

    async renameVideo(filename: string, newName: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName })
        });
        if (!res.ok) throw new Error('Rename failed');
        return await res.json();
    },

    async deleteVideo(filename: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        return await res.json();
    },

    getThumbnailUrl(filename: string): string {
        const token = getAuthToken();
        const base = `${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}`;
        return token ? `${base}?token=${token}` : base;
    },

    async generateThumbnail(filename: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}`, { method: 'POST' });
        return res.json();
    },

    async generatePreview(filename: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/preview`, { method: 'POST' });
        return res.json();
    },

    getPreviewUrl(filename: string): string {
        const token = getAuthToken();
        const base = `${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/preview`;
        return token ? `${base}?token=${token}` : base;
    },

    getStreamUrl(filename: string): string {
        const token = getAuthToken();
        const base = `${API_URL}/${filename}/stream`;
        return token ? `${base}?token=${token}` : base;
    },

    async getAssetDetails(filename: string): Promise<any> {
        const res = await fetchWithAuth(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/details`);
        return await res.json();
    },

    async trimVideo(filename: string, start: number, end: number, mode: string, saveAsNew: boolean, newName: string, overwriteTarget: boolean = false): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/trim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end, mode, saveAsNew, newName, overwriteTarget })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Trim failed');
        }
        return await res.json();
    },

    async splitVideo(filename: string, splitTime: number): Promise<any> {
        const res = await fetchWithAuth(`${API_URL}/${filename}/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ splitTime })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Split failed');
        }
        return await res.json();
    },

    // --- Admin Directories ---
    async fetchDirectories(): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/admin/directories`);
        if (!res.ok) throw new Error('Failed to fetch directories');
        return await res.json();
    },

    async addDirectory(name: string, path: string): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/admin/directories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, path })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to add directory');
        }
        return await res.json();
    },

    async deleteDirectory(id: string): Promise<any> {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetchWithAuth(`${baseUrl}/api/admin/directories/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete directory');
        return await res.json();
    }
};
