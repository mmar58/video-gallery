const fs = require('fs');
const path = require('path');
const { generateTagsFromText } = require('../src/services/ollamaService');
const store = require('../src/data/store');

const VIDEO_DIR = path.join(__dirname, '../../assets/videos');
const BLACKLIST_FILE = path.join(__dirname, '../src/data/blacklist.json');

// Parse args
const args = process.argv.slice(2);
const force = args.includes('--force');
const modelArg = args.find(a => a.startsWith('--model='));
const model = modelArg ? modelArg.split('=')[1] : 'llama3';

function getBlacklist() {
    if (!fs.existsSync(BLACKLIST_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    } catch (e) { return []; }
}

async function main() {
    console.log(`Starting Auto-Tagging with model: ${model}...`);
    if (force) console.log('Force mode enabled: Retagging all videos.');

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
    const blacklist = getBlacklist();

    const abortController = new AbortController(); // Not really used for aborting here, but service expects signal

    for (const [index, video] of videos.entries()) {
        const meta = store.get(video);

        // Skip if already tagged and not forced
        if (!force && meta.tags && meta.tags.length > 0) {
            continue;
        }

        const percent = Math.round(((index + 1) / videos.length) * 100);
        process.stdout.write(`[${percent}%] Tagging ${video}... `);

        const baseName = path.basename(video, path.extname(video));
        const prompt = "Generate 5-8 relevant, concise keywords/tags based on the filename. Return ONLY tags, comma-separated. No sentences.";

        try {
            const response = await generateTagsFromText(model, baseName, prompt, abortController.signal);

            let rawTags = response.split(/,|;|\n/).map(t => t.trim()).filter(t => t.length > 0);
            rawTags = rawTags.filter(t => !blacklist.includes(t.toLowerCase()));
            const tags = rawTags.filter(t => t.length < 30);

            if (tags.length > 0) {
                store.update(video, { tags: tags });
                console.log(`Tags: ${tags.join(', ')}`);
            } else {
                console.log('No tags generated.');
            }

            // Artificial delay to be nice to Ollama if needed
            // await new Promise(r => setTimeout(r, 500)); 

        } catch (err) {
            console.log('Error.');
            console.error(`Failed: ${err.message}`);
        }
    }

    console.log('Tagging complete!');
}

main();
