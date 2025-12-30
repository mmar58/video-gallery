const API_URL = 'http://192.168.0.2:5000/api/videos';

export const api = {
    async fetchVideos(search = '', sort = 'name', page = 1, limit = 12) {
        const res = await fetch(`${API_URL}?search=${search}&sort=${sort}&page=${page}&limit=${limit}`);
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
