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
            // Get current state
            let currentState;
            subscribe(s => currentState = s)();

            // Validate
            if (page < 1 || page > currentState.maxPage || page === currentState.page) return;

            // Trigger load logic (which updates store)
            // We reuse the load function logic here to avoid duplication or circular dependency
            const { search, sort } = currentState;

            // Call the load method defined above (we need to capture it or just invoke update logic directly)
            // Since `load` is part of the return object, we can't call it easily from here without defining it outside.
            // Let's just re-implement the fetch call for now or refactor. 
            // Better: define `loadVideos` helper inside createVideoStore.

            // ... actually, the cleanest quick fix without big refactor:
            update(s => ({ ...s, loading: true, page }));

            api.fetchVideos(search, sort, page)
                .then(data => {
                    update(s => ({
                        ...s,
                        videos: data.videos,
                        maxPage: data.pagination.totalPages,
                        loading: false
                    }));
                })
                .catch(err => {
                    update(s => ({ ...s, error: err.message, loading: false }));
                });
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
