const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

function responsiveSection(name) {
    const start = `/* Responsive Leaderboard: ${name} */`;
    const end = `/* End Responsive Leaderboard: ${name} */`;
    const startIndex = html.indexOf(start);
    const endIndex = html.indexOf(end);

    assert.notEqual(startIndex, -1, `${name} responsive section must exist`);
    assert.notEqual(endIndex, -1, `${name} responsive section must be closed`);
    return html.slice(startIndex, endIndex + end.length);
}

test('uses a compact breakpoint that includes common phone landscape widths', () => {
    const css = responsiveSection('Compact');

    assert.match(css, /@media \(max-width:\s*900px\)/);
    assert.match(css, /\.navbar\s*{[^}]*flex-wrap:\s*nowrap/);
    assert.match(css, /\.content-wrapper\s*{[^}]*padding:/);
    assert.match(css, /\.leaderboard-title\s*{[^}]*font-size:/);
    assert.match(css, /\.vla-arena-table th\s*{[^}]*min-width:\s*180px/);
    assert.match(css, /#vla-table-head tr:last-child th:not\(\.model-name\),[\s\S]*?\.vla-arena-table tbody td:not\(\.model-name\)\s*{[^}]*width:\s*180px;[^}]*max-width:\s*180px/);
    assert.match(css, /\.sparkline-container,[\s\S]*?\.dual-chart-container\s*{[^}]*width:\s*164px/);
});

test('uses a single-column portrait layout without category overflow', () => {
    const css = responsiveSection('Portrait');

    assert.match(css, /@media \(max-width:\s*700px\)/);
    assert.match(css, /\.control-row\s*{[^}]*flex-direction:\s*column/);
    assert.match(css, /\.control-label\s*{[^}]*min-width:\s*0/);
    assert.match(css, /\.category-groups-container\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    assert.match(css, /\.leaderboard-page\s*{[^}]*--portrait-table-gutter:\s*52px;[^}]*--portrait-model-width:\s*104px;[^}]*--portrait-task-width:\s*calc\(\(100vw\s*-\s*16px\s*-\s*var\(--portrait-model-width\)\)\s*\/\s*2\)/);
    assert.match(css, /\.vla-arena-table-wrapper\s*{[^}]*width:\s*calc\(100%\s*-\s*var\(--portrait-table-gutter\)\);[^}]*margin-left:\s*var\(--portrait-table-gutter\)/);
    assert.match(css, /\.vla-arena-table (?:th|td)\.model-name[\s\S]*?width:\s*var\(--portrait-model-width\)/);
    assert.match(css, /\.table-scroll-hint\s*{[^}]*display:\s*flex/);
    assert.match(css, /\.floating-btn\s*{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*padding:\s*0;[^}]*border-radius:\s*50%/);
    assert.match(css, /\.floating-btn span:not\(\.icon\)\s*{[^}]*display:\s*none/);
});

test('tracks the portrait indicator gutter directly during horizontal movement', () => {
    const css = responsiveSection('Portrait');

    assert.match(
        css,
        /#vla-table-head tr:last-child th:not\(\.model-name\),[\s\S]*?\.vla-arena-table tbody td:not\(\.model-name\)\s*{[^}]*width:\s*var\(--portrait-task-width\);[^}]*max-width:\s*var\(--portrait-task-width\)/
    );
    assert.match(
        css,
        /\.sparkline-container,[\s\S]*?\.dual-chart-container\s*{[^}]*width:\s*calc\(var\(--portrait-task-width\)\s*-\s*8px\)/
    );
    assert.match(css, /\.table-scroll-hint\s*{[^}]*margin:[^;}]*var\(--portrait-table-gutter\)/);
    assert.doesNotMatch(css, /portrait-table-expanded|is-horizontally-dismissed/);
    assert.doesNotMatch(
        css,
        /\.vla-arena-table-wrapper\s*{[^}]*transition:\s*(?:width|max-width|margin-left)/
    );
    assert.match(
        css,
        /#vla-table-head tr:last-child th:not\(\.model-name\)\s*{[^}]*white-space:\s*normal/
    );
    assert.match(html, /function updatePortraitTableViewport\(\)/);
    assert.match(html, /LeaderboardVisualization\.getPortraitTableGutter\(\{/);
    assert.match(html, /style\.setProperty\('--portrait-table-gutter',\s*`\$\{gutter\}px`\)/);
    assert.match(html, /function schedulePortraitTableViewportUpdate\(\)/);
    assert.match(html, /portraitTableFrame\s*=\s*window\.requestAnimationFrame/);
    assert.match(html, /function updatePortraitTableViewport\(\)\s*{[\s\S]*?handleFloatingTaskSelector\(\)/);
    assert.match(html, /tableWrapper\.addEventListener\('scroll',\s*handleLeaderboardTableScroll\)/);
    assert.match(html, /window\.addEventListener\('resize',\s*schedulePortraitTableViewportUpdate\)/);
    assert.doesNotMatch(html, /handlePortraitTableTransitionEnd|shouldExpandPortraitTaskViewport/);
});

test('packs portrait model links into a compact two-by-two grid', () => {
    const compactCss = responsiveSection('Compact');
    const portraitCss = responsiveSection('Portrait');

    assert.match(
        portraitCss,
        /\.model-links\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*15px\);[^}]*grid-auto-rows:\s*15px;[^}]*gap:\s*2px/
    );
    assert.match(
        portraitCss,
        /\.model-link\s*{[^}]*width:\s*15px;[^}]*height:\s*15px/
    );
    assert.doesNotMatch(compactCss, /\.model-links\s*{[^}]*display:\s*grid/);
});

test('keeps fixed actions out of short landscape content', () => {
    const css = responsiveSection('Short Landscape');

    assert.match(css, /@media \(orientation:\s*landscape\) and \(max-height:\s*500px\)/);
    assert.match(css, /\.floating-btn\.show\s*{[^}]*display:\s*none\s*!important/);
    assert.match(css, /\.leaderboard-header\s*{[^}]*margin-bottom:/);
    assert.match(css, /\.vla-arena-table th\s*{[^}]*padding:/);
});

test('provides a mobile-only horizontal swipe affordance for the table', () => {
    assert.match(
        html,
        /<p class="table-scroll-hint"[^>]*>\s*Swipe to compare tasks\s*<span[^>]*>→<\/span>\s*<\/p>/
    );
});

test('runs responsive and visualization checks in CI', () => {
    const workflow = fs.readFileSync(
        path.resolve(__dirname, '..', '.github', 'workflows', 'validate-results.yml'),
        'utf8'
    );

    for (const watchedPath of [
        'scripts/leaderboard-visualization.js',
        'scripts/leaderboard-visualization.test.js',
        'scripts/mobile-responsive.test.js'
    ]) {
        assert.ok(
            workflow.includes(`- '${watchedPath}'`),
            `CI must watch ${watchedPath}`
        );
    }
    assert.match(workflow, /run: node --test scripts\/\*\.test\.js/);
});
