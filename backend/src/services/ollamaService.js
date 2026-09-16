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
            const newEndpoints = settings.endpoints || [{ id: 'default', url: 'http://127.0.0.1:11434', weight: 1, active: true }];

            // Clear existing intervals for endpoints before refreshing
            for (const ep of this.endpoints) {
                if (ep.healthCheckInterval) {
                    clearInterval(ep.healthCheckInterval);
                }
            }

            this.endpoints = newEndpoints;

            // Setup clients for new endpoints
            for (const ep of this.endpoints) {
                if (!this.clients.has(ep.id)) {
                    this.clients.set(ep.id, new Ollama({ host: ep.url }));
                    this.activeRequests.set(ep.id, 0);
                }

                if (ep.active) {
                    this.checkInitialHealth(ep);
                }
            }

            this.processQueue();
        } catch (error) {
            console.error('[OllamaPool] Failed to refresh endpoints', error);
        }
    }

    async checkInitialHealth(ep) {
        try {
            const client = this.clients.get(ep.id);
            // console.log(client)
            let modelList = await client.list();
            // console.log(modelList, "for", client.config)
        } catch (error) {
            console.warn(`[OllamaPool] Endpoint ${ep.url} is offline on initialization. Disabling.`);
            // console.log("Warn", error)
            ep.active = false;
            this.startHealthCheckLoop(ep);
        }
    }

    startHealthCheckLoop(ep) {
        if (ep.healthCheckInterval) return; // already checking

        console.log(`[OllamaPool] Starting health checks for failed endpoint ${ep.url}...`);

        ep.healthCheckInterval = setInterval(async () => {
            try {
                const client = this.clients.get(ep.id);
                await client.list(); // Simple ping

                console.log(`[OllamaPool] Endpoint ${ep.url} is back online. Re-enabling.`);
                ep.active = true;
                clearInterval(ep.healthCheckInterval);
                ep.healthCheckInterval = null;

                this.processQueue();
            } catch (error) {
                // Silently fail and wait for next check
            }
        }, 60000);
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

    getAvailableEndpoint(allowedEndpointIds = null) {
        const activeEndpoints = this.endpoints.filter(ep => ep.active && (!allowedEndpointIds || allowedEndpointIds.includes(ep.id)));

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

        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            const ep = this.getAvailableEndpoint(item.allowedEndpointIds);
            if (ep) {
                this.queue.splice(i, 1);
                this.executeTaskOnEndpoint(item, ep);
                return; // process one at a time, executeTaskOnEndpoint will call processQueue again
            }
        }
    }

    async executeTaskOnEndpoint(item, ep) {
        const { taskFn, resolve, reject, retries = 0, logCallback } = item;

        const currentCount = this.activeRequests.get(ep.id) || 0;
        this.activeRequests.set(ep.id, currentCount + 1);

        try {
            const client = this.clients.get(ep.id);
            if (logCallback) logCallback(`Sending request to ${ep.url} (Attempt ${retries + 1})`, 'info');
            const result = await taskFn(client, ep);
            if (logCallback) logCallback(`Response from ${ep.url}: Success`, 'success');
            resolve(result);
        } catch (error) {
            if (logCallback) logCallback(`Response from ${ep.url}: Failed (${error.message})`, 'error');
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

            // Start checking health in the background before re-enabling
            this.startHealthCheckLoop(ep);

        } finally {
            const newCount = (this.activeRequests.get(ep.id) || 1) - 1;
            this.activeRequests.set(ep.id, Math.max(0, newCount));
            this.processQueue(); // See if more tasks can be run
        }
    }

    async dispatchTask(taskFn, allowedEndpointIds = null, logCallback = null) {
        if (this.endpoints.length === 0) {
            await this.initOrRefresh();
        }

        const activeEndpoints = this.endpoints.filter(ep => ep.active && (!allowedEndpointIds || allowedEndpointIds.includes(ep.id)));
        if (activeEndpoints.length === 0) {
            throw new Error('No active Ollama endpoints available for this task. Please check settings.');
        }

        return new Promise((resolve, reject) => {
            const item = { taskFn, resolve, reject, timestamp: Date.now(), retries: 0, allowedEndpointIds, logCallback };

            const ep = this.getAvailableEndpoint(allowedEndpointIds);
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

    async getModelsPerServer() {
        if (this.endpoints.length === 0) {
            await this.initOrRefresh();
        }

        const results = await Promise.all(this.endpoints.map(async ep => {
            try {
                const client = this.clients.get(ep.id);
                const response = await client.list();
                return { endpoint: ep, models: response.models, status: 'online' };
            } catch (err) {
                return { endpoint: ep, models: [], status: 'offline' };
            }
        }));
        return results;
    }

    async generateTagsFromText(modelMap, text, prompt = "Generate 5-10 relevant keywords or tags based on this text. Comma separated, no intro.", signal, logCallback = null) {
        const isMap = typeof modelMap === 'object';
        const allowedEndpointIds = isMap 
            ? Object.keys(modelMap).filter(id => modelMap[id] && modelMap[id] !== 'skip')
            : null;

        return this.dispatchTask(async (client, ep) => {
            const modelName = isMap ? modelMap[ep.id] : modelMap;
            const timeoutMs = 45000;
            let timeoutId;

            try {
                const generatePromise = client.generate({
                    model: modelName,
                    prompt: `${prompt}\n\nText: ${text}`
                });

                const timeoutPromise = new Promise((_, reject) =>
                    timeoutId = setTimeout(() => reject(new Error('Ollama generation timed out')), timeoutMs)
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
            } finally {
                clearTimeout(timeoutId);
            }
        }, allowedEndpointIds, logCallback);
    }
}

const pool = new OllamaPool();

module.exports = {
    getModels: () => pool.getModels(),
    getModelsPerServer: () => pool.getModelsPerServer(),
    generateTagsFromText: (m, t, p, s, logCb) => pool.generateTagsFromText(m, t, p, s, logCb),
    refreshPool: () => pool.initOrRefresh()
};
