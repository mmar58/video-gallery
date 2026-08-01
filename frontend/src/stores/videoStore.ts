import { writable } from 'svelte/store';
import { api } from '../lib/api';

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface VideoState {
    videos: any[];
    loading: boolean;
    error: string | null;
    sort: string;
    search: string;
    page: number;
    maxPage: number;
    tags: string[];        // Available tags
    stats: any | null;     // Date distribution stats
    pagination: Pagination;
    selectedTag: string; // Current filter
    days: string | number;
    dateFrom: string;
    dateTo: string;
    showHidden: boolean;
}

function createVideoStore() {
    const { subscribe, set, update } = writable<VideoState>({
        videos: [],
        loading: false,
        error: null,
        sort: 'name',
        search: '',
        page: 1,
        maxPage: 1,
        tags: [],
        stats: null,
        pagination: { total: 0, page: 1, limit: 12, totalPages: 1 },
        selectedTag: '',
        days: '',
        dateFrom: '',
        dateTo: '',
        showHidden: false
    });

    return {
        subscribe,
        load: async (search: string = '', sort: string = 'name', page: number = 1, tag: string = '', days: string | number = '', dateFrom: string = '', dateTo: string = '', showHidden: boolean = false) => {
            update(s => ({ ...s, loading: true, search, sort, page, selectedTag: tag, days, dateFrom, dateTo, showHidden }));
            try {
                // Fetch stats generally once or refresh
                const [videoData, tagsData, statsData] = await Promise.all([
                    api.fetchVideos(search, sort, page, 12, tag, days, dateFrom, dateTo, showHidden),
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
            } catch (err: any) {
                update(s => ({ ...s, error: err.message, loading: false }));
            }
        },
        setPage: (page: number) => {
            // Get current state
            let currentState!: VideoState;
            subscribe(s => currentState = s)();

            // Validate
            if (page < 1 || page > currentState.maxPage || page === currentState.page) return;

            // Trigger load logic (which updates store)
            const { search, sort, selectedTag, days, dateFrom, dateTo, showHidden } = currentState;

            update(s => ({ ...s, loading: true, page }));

            api.fetchVideos(search, sort, page, 12, selectedTag, days, dateFrom, dateTo, showHidden)
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
        setTag: (tag: string) => {
            update(s => {
                if (tag === s.selectedTag) return s;
                return { ...s, selectedTag: tag, page: 1 };
            });
            // Note: The calling component usually triggers reload via reactive statement
        },
        addTag: async (filename: string, tag: string) => {
            try {
                const meta = await api.addTag(filename, tag);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, tags: meta.tags || [] } : v),
                    tags: s.tags.includes(tag) ? s.tags : [...s.tags, tag].sort()
                }));
            } catch (e) { console.error(e); }
        },
        removeTag: async (filename: string, tag: string) => {
            try {
                const meta = await api.removeTag(filename, tag);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, tags: meta.tags || [] } : v)
                }));
            } catch (e) { console.error(e); }
        },
        toggleLike: async (filename: string) => {
            try {
                const meta = await api.likeVideo(filename);
                update(s => ({
                    ...s,
                    videos: s.videos.map(v => v.name === filename ? { ...v, likes: meta.likes } : v)
                }));
                return meta;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        rename: async (filename: string, newName: string) => {
            await api.renameVideo(filename, newName);
            // Reload to ensure list consistency
            return true;
        },
        remove: async (filename: string) => {
            await api.deleteVideo(filename);
            update(s => ({
                ...s,
                videos: s.videos.filter(v => v.name !== filename)
            }));
        },
        hideVideo: async (filename: string, days: number | string) => {
            await api.hideVideo(filename, days);
            update(s => ({
                ...s,
                videos: s.videos.filter(v => v.name !== filename)
            }));
        }
    };
}

export const videoStore = createVideoStore();
