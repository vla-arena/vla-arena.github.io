(function initializeModelManifestLoader(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.VLAArenaModelManifest = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createModelManifestLoader() {
    async function loadModelManifest(basePaths, fetchImpl) {
        const request = fetchImpl || (typeof fetch === 'function' ? fetch : null);
        if (!request) {
            return null;
        }

        for (const basePath of basePaths) {
            try {
                const response = await request(`${basePath}models.json`, { cache: 'no-cache' });
                if (!response.ok) {
                    continue;
                }

                const manifest = await response.json();
                if (!manifest || !Array.isArray(manifest.models)) {
                    continue;
                }

                const seenModelIds = new Set();
                const modelIds = [];
                for (const entry of manifest.models) {
                    if (typeof entry !== 'string') {
                        continue;
                    }

                    const modelId = entry.trim();
                    if (!modelId || seenModelIds.has(modelId)) {
                        continue;
                    }

                    seenModelIds.add(modelId);
                    modelIds.push(modelId);
                }

                if (modelIds.length > 0) {
                    return { basePath, modelIds };
                }
            } catch (error) {
                continue;
            }
        }

        return null;
    }

    return { loadModelManifest };
}));
