// GET /api/videos/stats - Get video statistics (date distribution)
router.get('/stats', (req, res) => {
    if (!fs.existsSync(VIDEO_DIR)) {
        return res.status(404).json({ error: 'Video directory not found' });
    }

    fs.readdir(VIDEO_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });

        const videoFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
        });

        const months = {};
        let minDate = new Date();
        let maxDate = new Date(0);

        videoFiles.forEach(file => {
            const stats = fs.statSync(getPath(file));
            const date = stats.birthtime;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (months[key]) months[key]++;
            else months[key] = 1;

            if (date < minDate) minDate = date;
            if (date > maxDate) maxDate = date;
        });

        res.json({
            distributions: months,
            minDate,
            maxDate,
            totalVideos: videoFiles.length
        });
    });
});
