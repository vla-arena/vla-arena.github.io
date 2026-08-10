const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const loaderPath = path.join(__dirname, 'model-manifest.js');

test('loads model IDs from the first valid manifest', async () => {
    assert.ok(fs.existsSync(loaderPath), 'scripts/model-manifest.js must exist');
    const { loadModelManifest } = require(loaderPath);
    const requests = [];
    const fetchImpl = async url => {
        requests.push(url);
        if (url === '/missing/models.json') {
            return { ok: false };
        }
        return {
            ok: true,
            json: async () => ({ models: ['openvla', 'stellavla', 'stellavla', '  '] })
        };
    };

    const result = await loadModelManifest(['/missing/', '/data/results/'], fetchImpl);

    assert.deepEqual(result, {
        basePath: '/data/results/',
        modelIds: ['openvla', 'stellavla']
    });
    assert.deepEqual(requests, [
        '/missing/models.json',
        '/data/results/models.json'
    ]);
});

test('returns null when every manifest is unavailable or invalid', async () => {
    assert.ok(fs.existsSync(loaderPath), 'scripts/model-manifest.js must exist');
    const { loadModelManifest } = require(loaderPath);
    const fetchImpl = async url => url.startsWith('/invalid/')
        ? { ok: true, json: async () => ({ models: [] }) }
        : { ok: false };

    assert.equal(
        await loadModelManifest(['/invalid/', '/missing/'], fetchImpl),
        null
    );
});

test('index uses the shared loader without fallback model IDs', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

    assert.match(html, /<script src="scripts\/model-manifest\.js"><\/script>/);
    assert.doesNotMatch(html, /fallbackModelIds/);
    assert.match(html, /VLAArenaModelManifest\.loadModelManifest/);
});
