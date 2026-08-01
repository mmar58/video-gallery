const { Ollama } = require('ollama');
const { getOllamaSettings } = require('../data/settingsStore');

class OllamaPool {
    constructor() {
        this.endpoints = [];
        this.clients = new Map(); // id -> Ollama instance
        this.activeRequests = new Map(); // id -> count
        this.queue = []; // { taskFn, resolve, reject, timestamp }
        this.queueCheckInterval = null;
        
        // Timeout for tasks in queue
        this.QUEUE_TIMEOUT_MS = 5 * 60 * 1000; 
    }

    async initOrRefresh() {
        try {
            const settings = await getOllamaSettings();
            this.endpoints = settings.endpoints || [{ id: 'default', url: 'http://127.0.0.1:11434', weight: 1, active: true }];
            
            // Setup clients for new endpoints
            for (const ep of this.endpoints) {
                if (!this.clients.has(ep.id)) {
                    this.clients.set(ep.id, new Ollama({ host: ep.url }));
                    this.activeRequests.set(ep.id, 0);
                }
            }
            
            this.processQueue();
        } catch (error) {
            console.error('[OllamaPool] Failed to refresh endpoints', error);
        }
    }

    startQueueMonitor() {
        if (!this.queueCheckInterval) {
            this.queueCheckInterval = setInterval(() => this.checkQueueTimeouts(), 30000); // Check every 30s
        }
    }

    checkQueueTimeouts() {
        const now = Date.now();
        // Remove and reject items that have been waiting too long
        this.queue = this.queue.filter(item => {
            if (now - item.timestamp > this.QUEUE_TIMEOUT_MS) {
                console.warn('[OllamaPool] Task queued for too long, rejecting.');
                item.reject(new Error('Ollama generation queued for more than 5 minutes. No servers are available or they are too busy.'));
                return false;
            }
            return true;
        });
        this.processQueue();
    }

    getAvailableEndpoint() {
        const activeEndpoints = this.endpoints.filter(ep => ep.active);
        
        if (activeEndpoints.length === 0) {
            return null;
        }

        // Find endpoint with lowest ratio of active_requests / weight
        // Only consider endpoints where active_requests < weight
        let best = null;
        let lowestRatio = Infinity;

        for (const ep of activeEndpoints) {
            const activeCount = this.activeRequests.get(ep.id) || 0;
            // The capacity is determined by weight
            if (activeCount < ep.weight) {
                const ratio = activeCount / ep.weight;
                if (ratio < lowestRatio) {
                    lowestRatio = ratio;
                    best = ep;
                }
            }
        }

        return best;
    }

    processQueue() {
        if (this.queue.length === 0) return;

        const ep = this.getAvailableEndpoint();
        if (ep) {
            const item = this.queue.shift();
            this.executeTaskOnEndpoint(item, ep);
        }
    }

    async executeTaskOnEndpoint(item, ep) {
        const { taskFn, resolve, reject, retries = 0 } = item;
        
        const currentCount = this.activeRequests.get(ep.id) || 0;
        this.activeRequests.set(ep.id, currentCount + 1);

        try {
            const client = this.clients.get(ep.id);
            const result = await taskFn(client, ep);
            resolve(result);
        } catch (error) {
            console.error(`[OllamaPool] Task failed on endpoint ${ep.url}:`, error.message);
            
            // Mark endpoint as inactive temporarily in memory to force failover
            console.warn(`[OllamaPool] Temporarily disabling endpoint ${ep.url} due to failure.`);
            ep.active = false;
            
            // Handle failover
            if (retries < 2) {
                console.log(`[OllamaPool] Retrying task... (Attempt ${retries + 1})`);
                this.queue.unshift({ ...item, retries: retries + 1, timestamp: Date.now() });
            } else {
                reject(new Error(`Failed after retries. Last error: ${error.message}`));
            }
            
            // Re-enable after 1 minute to test it again
            setTimeout(() => {
                console.log(`[OllamaPool] Re-enabling endpoint ${ep.url} after failure cooldown.`);
                ep.active = true;
                this.processQueue();
            }, 60000);

        } finally {
            const newCount = (this.activeRequests.get(ep.id) || 1) - 1;
            this.activeRequests.set(ep.id, Math.max(0, newCount));
            this.processQueue(); // See if more tasks can be run
        }
    }

    async dispatchTask(taskFn) {
        if (this.endpoints.length === 0) {
            await this.initOrRefresh();
        }

        const activeEndpoints = this.endpoints.filter(ep => ep.active);
        if (activeEndpoints.length === 0) {
            throw new Error('No active Ollama endpoints available. Please check settings.');
        }

        return new Promise((resolve, reject) => {
            const item = { taskFn, resolve, reject, timestamp: Date.now(), retries: 0 };
            
            const ep = this.getAvailableEndpoint();
            if (ep) {
                this.executeTaskOnEndpoint(item, ep);
            } else {
                // Queue the task
                this.queue.push(item);
                this.startQueueMonitor();
            }
        });
    }

    // Expose methods to be called
    async getModels() {
        return this.dispatchTask(async (client) => {
            const response = await client.list();
            return response.models;
        });
    }

    async generateTagsFromText(modelName, text, prompt = "Generate 5-10 relevant keywords or tags based on this text. Comma separated, no intro.", signal) {
        return this.dispatchTask(async (client) => {
            const timeoutMs = 45000;

            const generatePromise = client.generate({
                model: modelName,
                prompt: `${prompt}\n\nText: ${text}`
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Ollama generation timed out')), timeoutMs)
            );

            if (signal) {
                if (signal.aborted) throw new Error('Aborted');
                const abortPromise = new Promise((_, reject) => {
                    signal.addEventListener('abort', () => reject(new Error('Aborted')));
                });
                const response = await Promise.race([generatePromise, timeoutPromise, abortPromise]);
                return response.response;
            }

            const response = await Promise.race([generatePromise, timeoutPromise]);
            return response.response;
        });
    }
}

const pool = new OllamaPool();

module.exports = {
    getModels: () => pool.getModels(),
    generateTagsFromText: (m, t, p, s) => pool.generateTagsFromText(m, t, p, s),
    refreshPool: () => pool.initOrRefresh()
};
