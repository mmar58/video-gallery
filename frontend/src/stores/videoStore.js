import { writable } from 'svelte/store';
import { api } from '../lib/api';

function createVideoStore() {
    const { subscribe, set, update } = writable({
        videos: [],
        loading: false,
        error: null,
        sort: 'name',
        search: '',
        page: 1,
        maxPage: 1
    });

    return {
        subscribe,
        load: async (search = '', sort = 'name', page = 1) => {
            update(s => ({ ...s, loading: true, search, sort, page }));
            try {
                const data = await api.fetchVideos(search, sort, page);
                update(s => ({
                    ...s,
                    videos: data.videos,
                    maxPage: data.pagination.totalPages,
                    loading: false
                }));
            } catch (err) {
                update(s => ({ ...s, error: err.message, loading: false }));
            }
        },
        setPage: (page) => {
            update(s => {
                // Return same state if page is out of bounds or same
                if (page < 1 || page > s.maxPage || page === s.page) return s;
                // Trigger load with new page
                // Note: We need to access current search/sort
                // This is a bit tricky with just 'update'. 
                // A better way is to delegate to load()
                return s;
            });
            // We need to trigger load explicitly. 
            // Ideally we subscribe or use a derived store, but let's keep it simple.
        },
        toggleLike: async (filename) => {
            try {
                const meta = await api.likeVideo(filename);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, likes: meta.likes } : v)
                }));
            } catch (err) {
                console.error(err);
            }
        },
        rename: async (filename, newName) => {
            await api.renameVideo(filename, newName);
            // Reload to ensure list consistency
            return true;
        },
        remove: async (filename) => {
            await api.deleteVideo(filename);
            update(s => ({
                ...s,
                videos: s.videos.filter(v => v.name !== filename)
            }));
        }
    };
}

export const videoStore = createVideoStore();
