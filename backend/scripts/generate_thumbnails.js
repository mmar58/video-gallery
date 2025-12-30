const fs = require('fs');
const path = require('path');
const { generateThumbnail, generatePreview, deleteThumbnail } = require('../src/services/thumbnailService');

const VIDEO_DIR = path.join(__dirname, '../../assets/videos');

// Parse args
const args = process.argv.slice(2);
const force = args.includes('--force');

async function main() {
    console.log('Starting Thumbnail/Preview Generation...');
    if (force) console.log('Force mode enabled: Regenerating all.');

    if (!fs.existsSync(VIDEO_DIR)) {
        console.error('Video directory not found:', VIDEO_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(VIDEO_DIR);
    const videos = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
    });

    console.log(`Found ${videos.length} videos.`);

    for (const [index, video] of videos.entries()) {
        const percent = Math.round(((index + 1) / videos.length) * 100);
        process.stdout.write(`Processing [${percent}%] ${video}... `);

        try {
            if (force) {
                deleteThumbnail(video);
            }

            // Generate Static
            await generateThumbnail(video);

            // Generate Preview
            await generatePreview(video);

            console.log('Done.');
        } catch (err) {
            console.log('Error.');
            console.error(`Failed to process ${video}:`, err.message);
        }
    }

    console.log('All done!');
}

main();
