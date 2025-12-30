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
        maxPage: 1,
        tags: [],        // Available tags
        selectedTag: ''  // Current filter
    });

    return {
        subscribe,
        load: async (search = '', sort = 'name', page = 1, tag = '') => {
            update(s => ({ ...s, loading: true, search, sort, page, selectedTag: tag }));
            try {
                const [videoData, tagsData] = await Promise.all([
                    api.fetchVideos(search, sort, page, 12, tag),
                    api.fetchTags()
                ]);

                update(s => ({
                    ...s,
                    videos: videoData.videos,
                    maxPage: videoData.pagination.totalPages,
                    tags: tagsData,
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
        setTag: (tag) => {
            update(s => {
                if (tag === s.selectedTag) return s;
                // Trigger load with new tag
                // (Ideally we call load directly like in setPage fix, but for now we trust the component to react or we just update state and let auto-loader handle it?)
                // In page.svelte we have $: videoStore.load(...) reactive statement. 
                // If we update s.selectedTag here, does +page.svelte trigger load? 
                // +page.svelte listens to searchValue, sortValue variables, NOT the store state directly for parameters. 
                // So we should just update the store state AND trigger reload.
                return { ...s, selectedTag: tag, page: 1 };
            });
            // We need to actually trigger the fetch. 
            // Since +page.svelte controls the load via reactive vars, maybe we should just expose a method to update state?
            // Or better: The store should be the source of truth.
        },
        addTag: async (filename, tag) => {
            try {
                const meta = await api.addTag(filename, tag);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, tags: meta.tags || [] } : v),
                    tags: s.tags.includes(tag) ? s.tags : [...s.tags, tag].sort()
                }));
            } catch (e) { console.error(e); }
        },
        removeTag: async (filename, tag) => {
            try {
                const meta = await api.removeTag(filename, tag);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, tags: meta.tags || [] } : v)
                }));
            } catch (e) { console.error(e); }
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
