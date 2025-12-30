const { Ollama } = require('ollama');

const ollama = new Ollama();

/**
 * Fetch available models from Ollama
 */
const getModels = async () => {
    try {
        const response = await ollama.list();
        return response.models;
    } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
    }
};

/**
 * Generate tags from text (e.g. filename) using a text model
 * @param {string} modelName - The name of the model
 * @param {string} text - The text context (filename)
 * @param {string} prompt - The system prompt
 */
const generateTagsFromText = async (modelName, text, prompt = "Generate 5-10 relevant keywords or tags based on this text. Comma separated, no intro.") => {
    try {
        const timeoutMs = 45000; // 45s timeout

        const generatePromise = ollama.generate({
            model: modelName,
            prompt: `${prompt}\n\nText: ${text}`
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Ollama generation timed out')), timeoutMs)
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);
        return response.response;
    } catch (error) {
        console.error('Error generating tags from text:', error);
        throw error;
    }
};

module.exports = {
    getModels,
    generateTagsFromText
};
