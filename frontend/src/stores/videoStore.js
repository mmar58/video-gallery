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
        stats: null,     // Date distribution stats
        pagination: { total: 0, page: 1, limit: 12, totalPages: 1 },
        selectedTag: '', // Current filter
        days: '',
        dateFrom: '',
        dateTo: ''
    });

    return {
        subscribe,
        load: async (search = '', sort = 'name', page = 1, tag = '', days = '', dateFrom = '', dateTo = '') => {
            update(s => ({ ...s, loading: true, search, sort, page, selectedTag: tag, days, dateFrom, dateTo }));
            try {
                // Fetch stats generally once or refresh
                const [videoData, tagsData, statsData] = await Promise.all([
                    api.fetchVideos(search, sort, page, 12, tag, days, dateFrom, dateTo),
                    api.fetchTags(),
                    api.fetchStats()
                ]);

                update(s => ({
                    ...s,
                    videos: videoData.videos,
                    pagination: videoData.pagination,
                    maxPage: videoData.pagination.totalPages,
                    tags: tagsData,
                    stats: statsData,
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
            const { search, sort, selectedTag, days, dateFrom, dateTo } = currentState;

            update(s => ({ ...s, loading: true, page }));

            api.fetchVideos(search, sort, page, 12, selectedTag, days, dateFrom, dateTo)
                .then(data => {
                    update(s => ({
                        ...s,
                        videos: data.videos,
                        pagination: data.pagination,
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
                return { ...s, selectedTag: tag, page: 1 };
            });
            // Note: The calling component usually triggers reload via reactive statement
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
