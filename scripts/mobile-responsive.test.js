const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const visualization = require('./leaderboard-visualization.js');

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
    assert.match(
        css,
        /\.leaderboard-page\s*{[^}]*--portrait-table-leadin:\s*52px;[^}]*--portrait-table-gutter:\s*52px/
    );
    assert.match(
        css,
        /\.vla-arena-table-wrapper\s*{[^}]*display:\s*flex;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*margin-left:\s*0/
    );
    assert.match(
        css,
        /\.portrait-table-leadin,\s*\.sticky-header-leadin\s*{[^}]*flex:\s*0\s+0\s+var\(--portrait-table-leadin\)/
    );
    assert.match(
        css,
        /#sticky-table-header\s*{[^}]*--portrait-table-leadin:\s*52px/
    );
    assert.doesNotMatch(
        css,
        /\.vla-arena-table-wrapper\s*{[^}]*width:\s*calc\(100%\s*-\s*var\(--portrait-table-gutter\)\)/
    );
    assert.match(html, /<div class="portrait-table-leadin" aria-hidden="true"><\/div>/);
    assert.match(html, /stickyLeadIn\.className\s*=\s*'sticky-header-leadin'/);
    assert.match(html, /stickyViewport\.replaceChildren\(stickyLeadIn,\s*clonedTable\)/);
    assert.match(css, /\.vla-arena-table (?:th|td)\.model-name[\s\S]*?width:\s*var\(--portrait-model-width\)/);
    assert.match(css, /\.table-scroll-hint\s*{[^}]*display:\s*flex/);
    assert.match(css, /\.floating-btn\s*{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*padding:\s*0;[^}]*border-radius:\s*50%/);
    assert.match(
        css,
        /\.floating-btn span:not\(\.icon\):not\(\.material-icons\)\s*{[^}]*display:\s*none/
    );
});

test('uses a two-column Task Store phone layout with a narrow fallback', () => {
    const css = responsiveSection('Portrait');

    assert.match(css, /\.task-gallery\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.task-store-controls\s*{[^}]*flex-wrap:\s*wrap/);
    assert.match(css, /\.task-store-select-all\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.task-card-image\s*{[^}]*height:\s*auto;[^}]*aspect-ratio:\s*4\s*\/\s*3/);
    assert.match(css, /\.task-card-category\s*{[^}]*max-width:\s*calc\(100%\s*-\s*1rem\);[^}]*white-space:\s*normal/);
    assert.match(css, /\.task-card-name\s*{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere/);
    assert.match(html, /@media \(max-width:\s*340px\)[\s\S]*?\.task-gallery\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('keeps the Task Store detail modal readable on phones', () => {
    const css = responsiveSection('Portrait');

    assert.match(css, /\.task-modal\s*{[^}]*padding:\s*0\.5rem\s+0\.25rem/);
    assert.match(
        css,
        /\.task-modal-content\s*{[^}]*width:\s*calc\(100%\s*-\s*0\.5rem\);[^}]*max-width:\s*calc\(100%\s*-\s*0\.5rem\)/
    );
    assert.match(css, /\.task-modal-close\s*{[^}]*width:\s*36px;[^}]*height:\s*36px/);
    assert.match(
        css,
        /\.task-modal-title\s*{[^}]*padding:\s*3\.25rem\s+0\.75rem\s+1\.25rem;[^}]*font-size:\s*1\.35rem;[^}]*line-height:\s*1\.25/
    );
    assert.match(
        css,
        /\.task-detail-table-wrapper\s*{[^}]*padding:\s*0\.5rem\s+0\s+1rem;[^}]*overflow-x:\s*auto;[^}]*overscroll-behavior-x:\s*contain;[^}]*-webkit-overflow-scrolling:\s*touch/
    );
    assert.match(
        css,
        /\.task-detail-table\s*{[^}]*width:\s*720px;[^}]*min-width:\s*720px;[^}]*overflow:\s*visible/
    );
    assert.match(
        css,
        /\.task-detail-table th,\s*\.task-detail-table td\s*{[^}]*padding:\s*0\.6rem\s+0\.4rem;[^}]*font-size:\s*0\.85rem/
    );
    assert.match(
        css,
        /\.task-detail-table th:first-child,[\s\S]*?\.task-detail-table td:first-child\s*{[^}]*width:\s*90px;[^}]*position:\s*sticky;[^}]*left:\s*0;[^}]*z-index:\s*2/
    );
    assert.match(css, /\.task-detail-table th:first-child\s*{[^}]*z-index:\s*3;[^}]*background:\s*#f5f5f5/);
    assert.match(css, /\.task-detail-table td:first-child\s*{[^}]*background:\s*#fff/);
    assert.match(
        css,
        /\.task-detail-table th:not\(:first-child\),\s*\.task-detail-table td:not\(:first-child\)\s*{[^}]*width:\s*126px/
    );
    assert.match(css, /\.task-detail-canvas-container\s*{[^}]*height:\s*140px/);
    assert.match(
        html,
        /<thead>\s*<tr>\s*<th>Level<\/th>\s*<th>Task 1<\/th>\s*<th>Task 2<\/th>\s*<th>Task 3<\/th>\s*<th>Task 4<\/th>\s*<th>Task 5<\/th>\s*<\/tr>\s*<\/thead>/
    );
});

test('resets Task Store modal scroll state whenever a task is opened', () => {
    const openTaskModal = html.slice(
        html.indexOf('function openTaskModal(task)'),
        html.indexOf('function closeTaskModal()')
    );

    assert.match(
        openTaskModal,
        /const tableWrapper\s*=\s*modal\.querySelector\('\.task-detail-table-wrapper'\)/
    );
    assert.match(openTaskModal, /modal\.scrollTop\s*=\s*0/);
    assert.match(openTaskModal, /tableWrapper\.scrollLeft\s*=\s*0/);
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

test('positions the floating task selector from the scroll-moving table edge', () => {
    const portraitLeftAt = scrollLeft => 8 + visualization.getPortraitTableGutter({
        viewportWidth: 390,
        scrollLeft
    });
    const desktopLeftAt = scrollLeft => 50 + visualization.getPortraitTableGutter({
        viewportWidth: 1440,
        scrollLeft
    });

    assert.equal(visualization.getFloatingTaskPanelLeft(portraitLeftAt(0), 39), 10.5);
    assert.equal(visualization.getFloatingTaskPanelLeft(portraitLeftAt(26), 39), null);
    assert.equal(desktopLeftAt(0), 50);
    assert.equal(desktopLeftAt(12), 50);

    const handler = html.slice(
        html.indexOf('function handleFloatingTaskSelector()'),
        html.indexOf('function hideStickyTableHeader()')
    );
    assert.match(handler, /const tableRect = tableWrapper\.getBoundingClientRect\(\)/);
    assert.match(handler, /const floatingGutter = LeaderboardVisualization\.getPortraitTableGutter\(\{/);
    assert.match(handler, /tableRect\.left \+ floatingGutter/);
    assert.doesNotMatch(handler, /sourceTable\.getBoundingClientRect\(\)/);
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

test('contains long model titles and their full-parameter markers', () => {
    assert.match(
        html,
        /\.model-title\s*{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere/
    );
    assert.match(
        html,
        /\.full-param-icon\s*{[^}]*display:\s*inline-flex;[^}]*min-width:\s*17px;[^}]*flex-shrink:\s*0/
    );
    assert.match(
        html,
        /const iconLabelHtml\s*=\s*iconHtml\s*\?\s*`<wbr>\$\{iconHtml\}`\s*:\s*''/
    );
    assert.match(html, /<div class="model-title">\$\{modelName\}\$\{iconLabelHtml\}<\/div>/);
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

test('keeps the Home summary anchor within a symmetric mobile inset', () => {
    assert.match(
        html,
        /@media \(max-width:\s*600px\)[\s\S]*?\.benchmark-summary\s*{[^}]*padding:\s*0\s+1\.5rem/
    );
    assert.match(html, /\.summary-anchor\s*{[^}]*position:\s*absolute/);
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
