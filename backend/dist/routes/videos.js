"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const store_1 = __importDefault(require("../data/store"));
const db_1 = __importDefault(require("../data/db"));
const auth_1 = require("../middlewares/auth");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Helper to get allowed directories for user
const getAllowedDirectories = async (userId) => {
    // If admin, can see all? The prompt says "see all directory by default and admin can hide"
    const dirs = await (0, db_1.default)('root_directories').select('*');
    const hiddenPerms = await (0, db_1.default)('user_directory_permissions')
        .where({ user_id: userId, is_hidden: true });
    const hiddenDirIds = new Set(hiddenPerms.map(p => p.directory_id));
    return dirs.filter(d => !hiddenDirIds.has(d.id));
};
// Helper to get specific directory path
const getDirectoryPath = async (dirId, userId, isAdmin) => {
    if (!isAdmin) {
        const hidden = await (0, db_1.default)('user_directory_permissions').where({ user_id: userId, directory_id: dirId, is_hidden: true }).first();
        if (hidden)
            return null; // Not allowed
    }
    const dir = await (0, db_1.default)('root_directories').where({ id: dirId }).first();
    return dir ? dir.path : null;
};
// Parse combined filename (dirId::filename)
const parseFilename = (combined) => {
    const parts = combined.split('::');
    if (parts.length < 2)
        return { dirId: null, filename: combined };
    return { dirId: parseInt(parts[0]), filename: parts.slice(1).join('::') };
};
// GET /api/videos - List all videos
// This endpoint is the core of the video gallery. It fetches paginated video metadata
// from the SQLite database, applies dynamic filters (search, tags, dates, hidden status),
// and joins the video tags for the final response.
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const allowedDirs = await getAllowedDirectories(userId);
        const allowedDirIds = allowedDirs.map(d => d.id);
        if (allowedDirIds.length === 0) {
            // Early return if user has no directories allowed, saving DB processing time.
            return res.json({ videos: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
        }
        const { search, tag, sort, days, dateFrom, dateTo, hidden } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const nowMs = Date.now();
        // Base Query: Establish a secure boundary to only search within directories the user has permission to view.
        let query = (0, db_1.default)('videos')
            .whereIn('directory_id', allowedDirIds)
            .select('videos.*');
        // Search Filter: Searches by partial filename match OR by matching a tag associated with the video.
        if (search) {
            const lowerSearch = `%${search.toLowerCase()}%`;
            query = query.where(function () {
                this.whereRaw('LOWER(videos.filename) LIKE ?', [lowerSearch])
                    .orWhereIn('videos.id', (0, db_1.default)('video_tags')
                    .join('tags', 'video_tags.tag_id', 'tags.id')
                    .whereRaw('LOWER(tags.name) LIKE ?', [lowerSearch])
                    .select('video_tags.video_id'));
            });
        }
        // Tag Filter: Uses a subquery to restrict results to videos that possess the exact provided tag.
        if (tag) {
            query = query.whereIn('videos.id', (0, db_1.default)('video_tags')
                .join('tags', 'video_tags.tag_id', 'tags.id')
                .where('tags.name', tag)
                .select('video_tags.video_id'));
        }
        // Hidden Filter
        if (hidden === 'true') {
            query = query.where('videos.hide_until', '>', nowMs);
        }
        else {
            query = query.where(function () {
                this.whereNull('videos.hide_until').orWhere('videos.hide_until', '<=', nowMs);
            });
        }
        // Date Filtering
        if (days) {
            const past = new Date();
            past.setDate(past.getDate() - parseInt(days));
            query = query.where('videos.file_created_at', '>=', past);
        }
        else if (dateFrom || dateTo) {
            if (dateFrom)
                query = query.where('videos.file_created_at', '>=', new Date(dateFrom));
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                query = query.where('videos.file_created_at', '<=', to);
            }
        }
        // Total Count: Clone the complex query builder (without selections) to get the absolute 
        // total number of matching rows across all pages. This is required for frontend pagination.
        const [{ total: totalRows }] = await query.clone().clearSelect().count('* as total');
        const total = typeof totalRows === 'string' ? parseInt(totalRows) : totalRows;
        // Sort
        if (sort === 'likes') {
            query = query.orderBy('videos.likes', 'desc');
        }
        else if (sort === 'random') {
            query = query.orderByRaw('RANDOM()');
        }
        else if (sort === 'date') {
            query = query.orderBy('videos.file_created_at', 'desc');
        }
        else {
            query = query.orderBy('videos.filename', 'asc');
        }
        // Pagination
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const results = await query.limit(limit).offset(offset);
        // Tag Hydration: To avoid complex JOINs that duplicate row data, we fetch the tags 
        // specifically for the paginated subset of videos that we just retrieved.
        const videoIds = results.map((v) => v.id);
        let tagsMap = {};
        if (videoIds.length > 0) {
            const tagsRows = await (0, db_1.default)('video_tags')
                .join('tags', 'video_tags.tag_id', 'tags.id')
                .whereIn('video_tags.video_id', videoIds)
                .select('video_tags.video_id', 'tags.name');
            for (const row of tagsRows) {
                if (!tagsMap[row.video_id])
                    tagsMap[row.video_id] = [];
                tagsMap[row.video_id].push(row.name);
            }
        }
        // Format Response: The frontend expects a specific structure.
        // We combine directory_id and filename (e.g., '1::video.mp4') as a unique string identifier.
        const dirMap = new Map(allowedDirs.map(d => [d.id, d.path]));
        const paginatedVideos = results.map((v) => ({
            name: `${v.directory_id}::${v.filename}`,
            displayName: v.filename,
            path: dirMap.has(v.directory_id) ? path_1.default.join(dirMap.get(v.directory_id) || '', v.filename) : '',
            size: v.size || 0,
            created: v.file_created_at ? new Date(v.file_created_at) : new Date(),
            updated: v.file_updated_at ? new Date(v.file_updated_at) : new Date(),
            lastViewTime: v.last_view_time ? new Date(v.last_view_time) : null,
            likes: v.likes,
            tags: tagsMap[v.id] || [],
            hideUntil: v.hide_until
        }));
        res.json({
            videos: paginatedVideos,
            pagination: { page, limit, total, totalPages }
        });
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});
// GET /api/videos/stats - Get video statistics (date distribution)
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const allowedDirs = await getAllowedDirectories(userId);
        const allowedDirIds = allowedDirs.map(d => d.id);
        if (allowedDirIds.length === 0) {
            return res.json({ distributions: {}, minDate: new Date(), maxDate: new Date(), totalVideos: 0 });
        }
        const videos = await (0, db_1.default)('videos')
            .whereIn('directory_id', allowedDirIds)
            .whereNotNull('file_created_at')
            .select('file_created_at');
        const months = {};
        let minDate = null;
        let maxDate = null;
        let totalVideos = videos.length;
        for (const v of videos) {
            const date = new Date(v.file_created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + 1;
            if (!minDate || date < minDate)
                minDate = date;
            if (!maxDate || date > maxDate)
                maxDate = date;
        }
        res.json({
            distributions: months,
            minDate: minDate || new Date(),
            maxDate: maxDate || new Date(),
            totalVideos
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
// GET /api/videos/:filename/stream
router.get('/:filename/stream', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    if (!dirId)
        return res.status(400).send('Invalid filename format');
    const dirPath = await getDirectoryPath(dirId, req.user.id, req.user.is_admin);
    if (!dirPath)
        return res.status(403).send('Directory access denied');
    const filePath = path_1.default.join(dirPath, filename);
    if (!fs_1.default.existsSync(filePath))
        return res.status(404).send('File not found');
    const stat = fs_1.default.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path_1.default.extname(filename).toLowerCase();
    let contentType = 'video/mp4';
    if (ext === '.webm')
        contentType = 'video/webm';
    else if (ext === '.ogg')
        contentType = 'video/ogg';
    else if (ext === '.mkv')
        contentType = 'video/x-matroska';
    else if (ext === '.avi')
        contentType = 'video/x-msvideo';
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs_1.default.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
    }
    else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs_1.default.createReadStream(filePath).pipe(res);
    }
});
// For metadata endpoints, we use the original filename for now to keep store.js working seamlessly.
// Ideally, store.js should be refactored to use directory_id + filename.
router.post('/:filename/view', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    const now = new Date();
    await (0, db_1.default)('videos').where({ directory_id: dirId, filename }).update({ last_view_time: now });
    res.json({ lastViewTime: now });
});
router.post('/:filename/like', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    const currentMeta = await store_1.default.get(dirId, filename);
    const meta = await store_1.default.update(dirId, filename, {
        likes: (currentMeta.likes || 0) + 1
    });
    res.json(meta);
});
router.post('/:filename/hide', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    const { days } = req.body;
    let hideUntil = null;
    if (days && typeof days === 'number' && days > 0) {
        hideUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    }
    const meta = await store_1.default.update(dirId, filename, { hideUntil });
    res.json(meta);
});
router.put('/:filename', async (req, res) => {
    const { dirId, filename: oldName } = parseFilename(req.params.filename);
    const newName = req.body.newName;
    if (!dirId || !newName)
        return res.status(400).json({ error: 'Invalid input' });
    if (path_1.default.extname(oldName) !== path_1.default.extname(newName))
        return res.status(400).json({ error: 'Cannot change file extension' });
    const dirPath = await getDirectoryPath(dirId, req.user.id, req.user.is_admin);
    if (!dirPath)
        return res.status(403).send('Directory access denied');
    const oldPath = path_1.default.join(dirPath, oldName);
    const newPath = path_1.default.join(dirPath, newName);
    if (fs_1.default.existsSync(newPath))
        return res.status(409).json({ error: 'File with new name already exists' });
    fs_1.default.rename(oldPath, newPath, (err) => {
        if (err)
            return res.status(500).json({ error: 'Rename failed' });
        store_1.default.rename(dirId, oldName, newName);
        res.json({ success: true, newName: `${dirId}::${newName}` });
    });
});
const { deleteThumbnail } = require('../services/thumbnailService');
router.delete('/:filename', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    if (!dirId)
        return res.status(400).json({ error: 'Invalid input' });
    const dirPath = await getDirectoryPath(dirId, req.user.id, req.user.is_admin);
    if (!dirPath)
        return res.status(403).send('Directory access denied');
    const filePath = path_1.default.join(dirPath, filename);
    if (!fs_1.default.existsSync(filePath))
        return res.status(404).json({ error: 'File not found' });
    fs_1.default.unlink(filePath, (err) => {
        if (err)
            return res.status(500).json({ error: 'Delete failed' });
        store_1.default.delete(dirId, filename);
        deleteThumbnail(req.params.filename); // passing full name as thumbnail service uses it? We'll have to adapt thumbnailService
        res.json({ success: true });
    });
});
// ... Tags endpoints ...
router.get('/tags', async (req, res) => {
    const allData = await store_1.default.getAll();
    const tags = new Set();
    Object.values(allData).forEach((meta) => {
        if (meta.tags && Array.isArray(meta.tags))
            meta.tags.forEach((tag) => tags.add(tag));
    });
    res.json(Array.from(tags).sort());
});
router.post('/:filename/tags', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    const { tag } = req.body;
    if (!tag)
        return res.status(400).json({ error: 'Tag is required' });
    const currentData = await store_1.default.get(dirId, filename);
    const currentTags = currentData.tags || [];
    if (!currentTags.includes(tag)) {
        const meta = await store_1.default.update(dirId, filename, { tags: [...currentTags, tag] });
        res.json(meta);
    }
    else {
        res.json(currentData);
    }
});
router.delete('/:filename/tags/:tag', async (req, res) => {
    const { dirId, filename } = parseFilename(req.params.filename);
    const { tag } = req.params;
    const currentData = await store_1.default.get(dirId, filename);
    const currentTags = currentData.tags || [];
    const newTags = currentTags.filter((t) => t !== tag);
    const meta = await store_1.default.update(dirId, filename, { tags: newTags });
    res.json(meta);
});
router.post('/:filename/trim', async (req, res) => {
    const { dirId, filename: oldName } = parseFilename(req.params.filename);
    const { start, end, mode, saveAsNew, newName, overwriteTarget } = req.body;
    if (!dirId || start === undefined || end === undefined)
        return res.status(400).json({ error: 'Invalid input' });
    const dirPath = await getDirectoryPath(dirId, req.user.id, req.user.is_admin);
    if (!dirPath)
        return res.status(403).json({ error: 'Directory access denied' });
    const sourcePath = path_1.default.join(dirPath, oldName);
    if (!fs_1.default.existsSync(sourcePath))
        return res.status(404).json({ error: 'File not found' });
    const finalNewName = newName || oldName;
    const targetPath = path_1.default.join(dirPath, finalNewName);
    if (!overwriteTarget && fs_1.default.existsSync(targetPath) && targetPath !== sourcePath) {
        return res.status(409).json({ error: 'FILE_EXISTS' });
    }
    const tempPath = path_1.default.join(dirPath, `temp_${Date.now()}_${finalNewName}`);
    try {
        await new Promise((resolve, reject) => {
            let command = (0, fluent_ffmpeg_1.default)(sourcePath);
            if (mode === 'delete') {
                command
                    .complexFilter([
                    `[0:v]trim=start=0:end=${start},setpts=PTS-STARTPTS[v1]`,
                    `[0:a]atrim=start=0:end=${start},asetpts=PTS-STARTPTS[a1]`,
                    `[0:v]trim=start=${end},setpts=PTS-STARTPTS[v2]`,
                    `[0:a]atrim=start=${end},asetpts=PTS-STARTPTS[a2]`,
                    `[v1][a1][v2][a2]concat=n=2:v=1:a=1[outv][outa]`
                ])
                    .outputOptions(['-map', '[outv]', '-map', '[outa]']);
            }
            else {
                command.outputOptions([
                    `-ss ${start}`,
                    `-to ${end}`,
                    '-c', 'copy'
                ]);
            }
            command.output(tempPath)
                .on('end', () => resolve(null))
                .on('error', (err) => reject(err))
                .run();
        });
        if (!saveAsNew && targetPath === sourcePath) {
            fs_1.default.unlinkSync(sourcePath);
            fs_1.default.renameSync(tempPath, targetPath);
        }
        else {
            if (fs_1.default.existsSync(targetPath))
                fs_1.default.unlinkSync(targetPath);
            fs_1.default.renameSync(tempPath, targetPath);
            await store_1.default.add(dirId, finalNewName);
        }
        res.json({ success: true, newName: `${dirId}::${finalNewName}` });
    }
    catch (err) {
        console.error(err);
        if (fs_1.default.existsSync(tempPath))
            fs_1.default.unlinkSync(tempPath);
        res.status(500).json({ error: 'Processing failed' });
    }
});
router.post('/:filename/split', async (req, res) => {
    const { dirId, filename: oldName } = parseFilename(req.params.filename);
    const { splitTime } = req.body;
    if (!dirId || splitTime === undefined)
        return res.status(400).json({ error: 'Invalid input' });
    const dirPath = await getDirectoryPath(dirId, req.user.id, req.user.is_admin);
    if (!dirPath)
        return res.status(403).json({ error: 'Directory access denied' });
    const sourcePath = path_1.default.join(dirPath, oldName);
    if (!fs_1.default.existsSync(sourcePath))
        return res.status(404).json({ error: 'File not found' });
    const ext = path_1.default.extname(oldName);
    const base = path_1.default.basename(oldName, ext);
    const part1Name = `${base}_part1${ext}`;
    const part2Name = `${base}_part2${ext}`;
    const part1Path = path_1.default.join(dirPath, part1Name);
    const part2Path = path_1.default.join(dirPath, part2Name);
    try {
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(sourcePath)
                .outputOptions([`-to ${splitTime}`, '-c', 'copy'])
                .output(part1Path)
                .on('end', () => resolve(null))
                .on('error', (err) => reject(err))
                .run();
        });
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(sourcePath)
                .outputOptions([`-ss ${splitTime}`, '-c', 'copy'])
                .output(part2Path)
                .on('end', () => resolve(null))
                .on('error', (err) => reject(err))
                .run();
        });
        await store_1.default.add(dirId, part1Name);
        await store_1.default.add(dirId, part2Name);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Processing failed' });
    }
});
exports.default = router;
