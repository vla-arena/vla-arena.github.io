const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function readRootFile(relativePath) {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function readJson(relativePath) {
    return JSON.parse(readRootFile(relativePath));
}

test('uses the approved display names for upstream models', () => {
    const expectedNames = new Map([
        ['data/results/dm05.json', 'DM0.5'],
        ['data/results/groot-n1.7.json', 'GR00T-N1.7'],
        ['data/results/lingbot-vla-v2.json', 'LingBot-VLA 2.0'],
        ['data/results/molmoact2.json', 'MolmoAct2']
    ]);

    for (const [filePath, expectedName] of expectedNames) {
        assert.equal(readJson(filePath).name, expectedName, filePath);
    }
});

test('uses generic SEO keywords instead of enumerating models', () => {
    const html = readRootFile('index.html');
    const head = html.match(/<head>([\s\S]*?)<\/head>/i);
    assert.ok(head, 'index.html must contain a head element');

    for (const modelName of ['OpenVLA', 'LingBot-VLA', 'StellaVLA', 'MolmoAct2']) {
        assert.doesNotMatch(head[1], new RegExp(modelName, 'i'));
    }
});

test('uses the concise unselected-task display label', () => {
    const html = readRootFile('index.html');

    assert.match(
        html,
        />Show unselected tasks<\/label>/
    );
    assert.doesNotMatch(html, /excluded from sorting|view only/);
});

test('uses a text-only leaderboard heading with a non-italic description', () => {
    const html = readRootFile('index.html');
    const descriptionRule = html.match(/\.leaderboard-description\s*{([^}]*)}/);

    assert.doesNotMatch(html, /leaderboard-icon|📊/);
    assert.ok(descriptionRule, 'leaderboard description style must exist');
    assert.match(descriptionRule[1], /font-style:\s*normal/);
});

test('keeps the top navigation on one row at mobile widths', () => {
    const html = readRootFile('index.html');

    assert.match(
        html,
        /@media \(max-width: 600px\)\s*{[\s\S]*?\.navbar\s*{[^}]*flex-wrap:\s*nowrap;/
    );
    assert.match(
        html,
        /@media \(max-width: 600px\)\s*{[\s\S]*?\.navlink\s*{[^}]*white-space:\s*nowrap;/
    );
});

test('documents the model ID manifest and display-name source', () => {
    const readme = readRootFile('README.md');

    assert.match(
        readme,
        /Each model ID listed in `data\/results\/models\.json` must match its result filename \(without `\.json`\), be unique, and use only lowercase letters, numbers, dots, underscores, and hyphens/
    );
    assert.match(
        readme,
        /The leaderboard loads model result files listed in `data\/results\/models\.json`; add your unique model ID there when contributing a new result file/
    );
    assert.match(
        readme,
        /Model display names are loaded from the `"name"` field in each `data\/results\/<model_id>\.json` file/
    );
    assert.match(
        readme,
        /node --test scripts\/model-manifest\.test\.js scripts\/site-content\.test\.js/
    );
});

test('runs site tests in CI when model-loading content changes', () => {
    const workflow = readRootFile('.github/workflows/validate-results.yml');
    const watchedPaths = [
        'index.html',
        'README.md',
        'scripts/model-manifest.js',
        'scripts/model-manifest.test.js',
        'scripts/site-content.test.js'
    ];

    for (const watchedPath of watchedPaths) {
        assert.ok(
            workflow.includes(`- '${watchedPath}'`),
            `CI must watch ${watchedPath}`
        );
    }
    assert.match(
        workflow,
        /run: node --test scripts\/model-manifest\.test\.js scripts\/site-content\.test\.js/
    );
    assert.match(workflow, /run: node scripts\/validate-results\.js/);
});
