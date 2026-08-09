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

test('provides a responsive floating task selector without a visible heading', () => {
    const html = readRootFile('index.html');
    const floatingPanel = html.match(
        /<aside[^>]*id="floating-task-selector"[^>]*>([\s\S]*?)<\/aside>/
    );

    assert.match(html, /id="task-category-selection"/);
    assert.ok(floatingPanel, 'floating task selector container must exist');
    assert.doesNotMatch(floatingPanel[1], /<h[1-6]\b/i);
    assert.match(html, /function handleFloatingTaskSelector\(\)/);
    assert.match(
        html,
        /window\.addEventListener\('resize', handleFloatingTaskSelector\)/
    );
    assert.match(
        html,
        /\.floating-task-selector \.task-indicator-group\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*13px\)/
    );
    assert.match(
        html,
        /\.floating-task-selector \.task-indicator\s*{[^}]*width:\s*13px;[^}]*height:\s*13px/
    );
    assert.match(
        html,
        /\.floating-task-selector\s*{[^}]*padding:\s*10px 4px/
    );
    assert.doesNotMatch(
        html,
        /\.floating-task-selector\s*{[^}]*display:\s*none\s*!important/
    );
    assert.match(html, /panel\.offsetWidth/);
    const hideSelector = html.match(
        /function hideFloatingTaskSelector\(panel\)\s*{([\s\S]*?)\n\s*}/
    );
    assert.ok(hideSelector, 'floating selector hide helper must exist');
    assert.match(hideSelector[1], /panel\.classList\.remove\('show'\)/);
    assert.doesNotMatch(
        hideSelector[1],
        /removeProperty\('left'\)|style\.left\s*=/
    );
    assert.match(
        html,
        /<div class="control-section" id="task-category-selection">\s*<div class="control-section-title">Task Category Selection<\/div>/
    );
    assert.match(html, /<script src="scripts\/leaderboard-visualization\.js"><\/script>/);
});

test('keeps model metadata separate and compacts dual-metric summaries', () => {
    const html = readRootFile('index.html');

    assert.match(html, /class="model-metadata/);
    assert.match(html, /model-cell-content/);
    assert.match(html, /model-metric-summaries/);
    assert.match(html, /has-both-metrics/);
    assert.match(
        html,
        /\.model-cell-content\s*{[^}]*justify-content:\s*flex-start/
    );
    assert.match(
        html,
        /\.model-cell-content\s*{[^}]*position:\s*relative/
    );
    assert.match(
        html,
        /\.model-metadata\s*{[^}]*position:\s*static/
    );
    assert.match(
        html,
        /\.model-metadata\s*{[^}]*margin-top:\s*auto/
    );
    assert.match(html, /\.model-title\s*{[^}]*position:\s*absolute/);
    assert.match(html, /\.model-title\s*{[^}]*top:\s*50%/);
    assert.match(
        html,
        /\.model-title\s*{[^}]*transform:\s*translateY\(-50%\)/
    );
    assert.match(html, /\.model-title\s*{[^}]*text-align:\s*center/);
    assert.match(
        html,
        /\.model-metric-summaries\.has-both-metrics\s*{[^}]*--summary-font-size:/
    );
    assert.match(
        html,
        /\.model-metric-summaries\.has-both-metrics\s*{[^}]*--summary-gap:\s*0px/
    );
    assert.match(
        html,
        /\.model-metric-summaries\.has-both-metrics\s*{[^}]*--bar-margin-top:\s*1px/
    );
    assert.match(
        html,
        /\.model-metadata\.has-release-month\s*{[^}]*padding-top:/
    );
    assert.match(html, /\.sr-level-segment\.l0/);
    assert.match(html, /\.is-secondary \.sr-level-segment\.l2/);
    assert.match(
        html,
        /\.model-average-bar\.is-primary \.sr-level-segment\.l0\s*{[^}]*background:\s*#7acb91/
    );
    assert.match(
        html,
        /\.model-average-bar\.is-primary \.sr-level-segment\.l2\s*{[^}]*background:\s*#1f8f4d/
    );
    assert.match(
        html,
        /\.model-average-bar\.is-secondary \.sr-level-segment\.l0\s*{[^}]*background:\s*#d1d5db/
    );
    assert.match(
        html,
        /\.model-average-bar\.is-secondary \.sr-level-segment\.l2\s*{[^}]*background:\s*#6b7280/
    );
});

test('shows immediate custom labels for SR level segments', () => {
    const html = readRootFile('index.html');

    assert.match(
        html,
        /\.sr-level-tooltip\s*{[^}]*position:\s*fixed/
    );
    assert.match(html, /function getSrLevelTooltip\(\)/);
    assert.match(html, /function showSrLevelTooltip\(target\)/);
    assert.match(html, /function hideSrLevelTooltip\(\)/);
    assert.match(html, /target\.dataset\.srLevelLabel/);
    assert.match(
        html,
        /setAttribute\('aria-describedby', tooltip\.id\)/
    );
    assert.match(
        html,
        /event\.target\.closest\('\.sr-level-segment'\)/
    );
    assert.match(
        html,
        /window\.addEventListener\('scroll', hideSrLevelTooltip, true\)/
    );
    assert.match(
        html,
        /window\.addEventListener\('resize', hideSrLevelTooltip\)/
    );
    assert.match(
        html,
        /function updateTable\(\)\s*{[\s\S]*?hideSrLevelTooltip\(\)/
    );
});

test('provides a synchronized two-row sticky Leaderboard header', () => {
    const html = readRootFile('index.html');

    assert.match(html, /id="sticky-table-header"/);
    assert.match(
        html,
        /\.sticky-table-header\s*{[^}]*position:\s*fixed/
    );
    assert.match(
        html,
        /\.sticky-table-header\s*{[^}]*overflow:\s*hidden/
    );
    assert.match(html, /function renderStickyTableHeader\(\)/);
    assert.match(html, /function handleStickyTableHeader\(\)/);
    assert.match(
        html,
        /stickyViewport\.scrollLeft\s*=\s*tableWrapper\.scrollLeft/
    );
    assert.match(html, /sourceHeader\.click\(\)/);
    assert.match(
        html,
        /tableWrapper\.addEventListener\('scroll', syncStickyTableHeaderScroll\)/
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
