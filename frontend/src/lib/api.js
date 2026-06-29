import { SOCKET_URL } from "./socket.js"
const API_URL = `${SOCKET_URL}/api/videos`;

export const api = {
    async fetchVideos(search = '', sort = 'name', page = 1, limit = 12, tag = '', days = '', dateFrom = '', dateTo = '', hidden = false) {
        let query = `${API_URL}?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}&limit=${limit}&tag=${encodeURIComponent(tag)}`;
        if (days) query += `&days=${days}`;
        if (dateFrom) query += `&dateFrom=${dateFrom}`;
        if (dateTo) query += `&dateTo=${dateTo}`;
        if (hidden) query += `&hidden=true`;

        const res = await fetch(query);
        return await res.json();
    },

    async fetchStats() {
        const res = await fetch(`${API_URL}/stats`);
        return await res.json();
    },

    async fetchBlacklist() {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist`);
        return await res.json();
    },

    async fetchOllamaSettings() {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: fetchOllamaSettings request', `${baseUrl}/api/settings/ollama`);
        const res = await fetch(`${baseUrl}/api/settings/ollama`);
        if (!res.ok) throw new Error('Failed to fetch Ollama settings');
        const data = await res.json();
        console.log('[settings-debug] api: fetchOllamaSettings success', data);
        return data;
    },

    async saveOllamaSettings(settings) {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: saveOllamaSettings request', settings);
        const res = await fetch(`${baseUrl}/api/settings/ollama`, {
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

    async blacklistWord(word) {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word }),
        });
        return res.json();
    },

    async removeBlacklistWord(word) {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/settings/blacklist/${word}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // --- Tags ---
    async fetchTags() {
        const res = await fetch(`${API_URL}/tags`);
        return res.json();
    },

    async fetchTagsWithStats() {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetch(`${baseUrl}/api/tags`);
        return res.json();
    },

    async renameTag(oldTag, newName) {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetch(`${baseUrl}/api/tags/${encodeURIComponent(oldTag)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName })
        });
        return res.json();
    },

    async deleteTag(tag) {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetch(`${baseUrl}/api/tags/${encodeURIComponent(tag)}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async blacklistTag(tag) {
        const baseUrl = API_URL.replace('/api/videos', '');
        const res = await fetch(`${baseUrl}/api/tags/${encodeURIComponent(tag)}/blacklist`, {
            method: 'POST'
        });
        return res.json();
    },

    async getModels() {
        const baseUrl = API_URL.replace('/api/videos', '');
        console.log('[settings-debug] api: getModels request', `${baseUrl}/api/ollama/models`);
        const res = await fetch(`${baseUrl}/api/ollama/models`);
        if (!res.ok) throw new Error('Failed to fetch Ollama models');
        const data = await res.json();
        console.log('[settings-debug] api: getModels success count', Array.isArray(data) ? data.length : 0);
        return data;
    },

    async uploadVideo(formData, onProgress) {
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

    async addTag(filename, tag) {
        const res = await fetch(`${API_URL}/${filename}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag })
        });
        return await res.json();
    },

    async removeTag(filename, tag) {
        const res = await fetch(`${API_URL}/${filename}/tags/${tag}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    async likeVideo(filename) {
        const res = await fetch(`${API_URL}/${filename}/like`, { method: 'POST' });
        return await res.json();
    },

    async hideVideo(filename, days) {
        const res = await fetch(`${API_URL}/${filename}/hide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: Number(days) })
        });
        return await res.json();
    },

    async renameVideo(filename, newName) {
        const res = await fetch(`${API_URL}/${filename}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName })
        });
        if (!res.ok) throw new Error('Rename failed');
        return await res.json();
    },

    async deleteVideo(filename) {
        const res = await fetch(`${API_URL}/${filename}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        return await res.json();
    },

    getThumbnailUrl(filename) {
        return `${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}`;
    },

    async generateThumbnail(filename) {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}`, { method: 'POST' });
        return await res.json();
    },

    async generatePreview(filename) {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/preview`, { method: 'POST' });
        return await res.json();
    },

    getPreviewUrl(filename) {
        return `${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/preview`;
    },

    getStreamUrl(filename) {
        return `${API_URL}/${filename}/stream`;
    },

    async getAssetDetails(filename) {
        const res = await fetch(`${API_URL.replace('/api/videos', '')}/api/thumbnails/${encodeURIComponent(filename)}/details`);
        return await res.json();
    },

    async trimVideo(filename, start, end, saveAsNew, newName, overwriteTarget = false) {
        const res = await fetch(`${API_URL}/${filename}/trim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end, saveAsNew, newName, overwriteTarget })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Trim failed');
        }
        return await res.json();
    },

    async splitVideo(filename, splitTime) {
        const res = await fetch(`${API_URL}/${filename}/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ splitTime })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Split failed');
        }
        return await res.json();
    }
};
