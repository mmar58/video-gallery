"use strict";
const db = require('./db');
module.exports = {
    getAll: async () => {
        const videos = await db('videos').select('*');
        const videoTags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .select('video_tags.video_id', 'tags.name');
        const metadata = {};
        for (const v of videos) {
            metadata[v.filename] = { likes: v.likes, tags: [] };
        }
        for (const vt of videoTags) {
            const v = videos.find(v => v.id === vt.video_id);
            if (v && metadata[v.filename]) {
                metadata[v.filename].tags.push(vt.name);
            }
        }
        return metadata;
    },
    get: async (filename) => {
        const video = await db('videos').where({ filename }).first();
        if (!video)
            return { likes: 0, tags: [] };
        const tags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .where('video_tags.video_id', video.id)
            .select('tags.name');
        return { likes: video.likes, tags: tags.map(t => t.name) };
    },
    add: async (filename) => {
        let video = await db('videos').where({ filename }).first();
        if (!video) {
            const [newVideo] = await db('videos').insert({ filename, likes: 0 }).returning('*');
            video = newVideo;
        }
        return { likes: video.likes, tags: [] };
    },
    update: async (filename, updates) => {
        let video = await db('videos').where({ filename }).first();
        if (!video) {
            const [newVideo] = await db('videos').insert({ filename, likes: 0 }).returning('*');
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
        const tags = await db('video_tags')
            .join('tags', 'video_tags.tag_id', 'tags.id')
            .where('video_tags.video_id', video.id)
            .select('tags.name');
        return { likes: video.likes, tags: tags.map(t => t.name) };
    },
    rename: async (oldName, newName) => {
        await db('videos').where({ filename: oldName }).update({ filename: newName });
    },
    delete: async (filename) => {
        await db('videos').where({ filename }).delete();
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
            }
            else {
                await db('tags').where({ id: tag.id }).update({ name: newTag });
            }
        }
    }
};
