const API_URL = 'http://192.168.0.2:5000/api/videos';

export const api = {
    async fetchVideos(search = '', sort = 'name', page = 1, limit = 12, tag = '') {
        const res = await fetch(`${API_URL}?search=${search}&sort=${sort}&page=${page}&limit=${limit}&tag=${tag}`);
        return await res.json();
    },
    async fetchTags() {
        const res = await fetch(`${API_URL}/tags`);
        return await res.json();
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

    getStreamUrl(filename) {
        return `${API_URL}/${filename}/stream`;
    }
};
