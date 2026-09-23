const db = require('./db');

module.exports = {
    getAll: async () => {
        const videos = await db('videos').select('*');
        const videoTags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .select('video_tags.video_id', 'tags.name');
        
        const metadata = {};
        for (const v of videos) {
            const key = v.directory_id ? `${v.directory_id}::${v.filename}` : v.filename;
            metadata[key] = { likes: v.likes, tags: [], hideUntil: v.hide_until };
        }
        for (const vt of videoTags) {
            const v = videos.find(v => v.id === vt.video_id);
            if (v) {
                const key = v.directory_id ? `${v.directory_id}::${v.filename}` : v.filename;
                if (metadata[key]) {
                    metadata[key].tags.push(vt.name);
                }
            }
        }
        return metadata;
    },

    get: async (directoryId, filename) => {
        const video = await db('videos').where({ directory_id: directoryId, filename }).first();
        if (!video) return { likes: 0, tags: [], hideUntil: null };

        const tags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .where('video_tags.video_id', video.id)
            .select('tags.name');

        return { likes: video.likes, tags: tags.map(t => t.name), hideUntil: video.hide_until };
    },

    add: async (directoryId, filename) => {
        let video = await db('videos').where({ directory_id: directoryId, filename }).first();
        if (!video) {
            const [newVideo] = await db('videos').insert({ directory_id: directoryId, filename, likes: 0 }).returning('*');
            video = newVideo;
        }
        return { likes: video.likes, tags: [], hideUntil: video.hide_until };
    },

    update: async (directoryId, filename, updates) => {
        let video = await db('videos').where({ directory_id: directoryId, filename }).first();
        if (!video) {
            const [newVideo] = await db('videos').insert({ directory_id: directoryId, filename, likes: 0 }).returning('*');
            video = newVideo;
        }

        if (updates.likes !== undefined) {
            await db('videos').where({ id: video.id }).update({ likes: updates.likes });
            video.likes = updates.likes;
        }

        if (updates.tags !== undefined) {
            // Delete old tags
            await db('video_tags').where({ video_id: video.id }).delete();
            
            // Insert new tags
            for (const tagName of updates.tags) {
                let tag = await db('tags').whereRaw('LOWER(name) = ?', [tagName.toLowerCase()]).first();
                if (!tag) {
                    const [newTag] = await db('tags').insert({ name: tagName }).returning('*');
                    tag = newTag;
                }
                await db('video_tags').insert({ video_id: video.id, tag_id: tag.id }).onConflict(['video_id', 'tag_id']).ignore();
            }
        }

        if (updates.hideUntil !== undefined) {
            await db('videos').where({ id: video.id }).update({ hide_until: updates.hideUntil });
            video.hide_until = updates.hideUntil;
        }

        const tags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .where('video_tags.video_id', video.id)
            .select('tags.name');

        return { likes: video.likes, tags: tags.map(t => t.name), hideUntil: video.hide_until };
    },

    rename: async (directoryId, oldName, newName) => {
        await db('videos').where({ directory_id: directoryId, filename: oldName }).update({ filename: newName });
    },

    delete: async (directoryId, filename) => {
        await db('videos').where({ directory_id: directoryId, filename }).delete();
    },

    removeTagFromAll: async (tagToRemove) => {
        const lowerTag = tagToRemove.toLowerCase();
        const tag = await db('tags').whereRaw('LOWER(name) = ?', [lowerTag]).first();
        if (tag) {
            await db('tags').where({ id: tag.id }).delete();
        }
    },

    renameTagInAll: async (oldTag, newTag) => {
        const lowerOld = oldTag.toLowerCase();
        const tag = await db('tags').whereRaw('LOWER(name) = ?', [lowerOld]).first();
        
        if (tag) {
            // Check if newTag already exists
            const existingNew = await db('tags').whereRaw('LOWER(name) = ?', [newTag.toLowerCase()]).first();
            if (existingNew) {
                // Update video_tags to point to existingNew, then delete old tag
                await db('video_tags').where({ tag_id: tag.id }).update({ tag_id: existingNew.id }).onConflict(['video_id', 'tag_id']).ignore();
                // some might have been ignored (already had the new tag), so just delete old video_tags
                await db('video_tags').where({ tag_id: tag.id }).delete();
                await db('tags').where({ id: tag.id }).delete();
            } else {
                await db('tags').where({ id: tag.id }).update({ name: newTag });
            }
        }
    }
};
