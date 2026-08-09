const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const modulePath = path.join(__dirname, 'leaderboard-visualization.js');

let visualization = {};
try {
    visualization = require(modulePath);
} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
    }
}

test('groups task indicators by category while preserving task order and selection', () => {
    assert.equal(typeof visualization.getTaskIndicatorGroups, 'function');

    const tasks = [
        { name: 'safe-a', category: 'Safety' },
        { name: 'safe-b', category: 'Safety' },
        { name: 'long-a', category: 'Long Horizon' },
        { name: 'libero', category: 'LIBERO' }
    ];

    assert.deepEqual(
        visualization.getTaskIndicatorGroups(tasks, new Set(['safe-a', 'long-a'])),
        [
            {
                category: 'Safety',
                categoryClass: 'safety',
                tasks: [
                    { name: 'safe-a', selected: true },
                    { name: 'safe-b', selected: false }
                ]
            },
            {
                category: 'Long Horizon',
                categoryClass: 'long-horizon',
                tasks: [
                    { name: 'long-a', selected: true }
                ]
            }
        ]
    );
});

test('renders a reusable accessible task indicator map for benchmark dimensions', () => {
    assert.equal(typeof visualization.getTaskIndicatorMapHtml, 'function');

    const html = visualization.getTaskIndicatorMapHtml(
        [
            { name: 'safe-a', category: 'Safety' },
            { name: 'distractor-a', category: 'Distractor' },
            { name: 'libero', category: 'LIBERO' }
        ],
        new Set(['safe-a', 'libero'])
    );

    assert.match(html, /class="task-indicator-map"/);
    assert.match(html, /class="task-indicator safety is-selected"/);
    assert.match(html, /aria-label="Safety: safe-a"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /class="task-indicator distractor"/);
    assert.match(html, /<span class="task-indicator-tooltip">Distractor: distractor-a<\/span>/);
    assert.doesNotMatch(html, /libero|LIBERO/);
    assert.equal((html.match(/<button/g) || []).length, 2);
});

test('centers the floating task panel only when the left gutter can contain it', () => {
    assert.equal(typeof visualization.getFloatingTaskPanelLeft, 'function');
    assert.equal(visualization.getFloatingTaskPanelLeft(39, 39), 0);
    assert.equal(visualization.getFloatingTaskPanelLeft(38, 39), null);
    assert.equal(visualization.getFloatingTaskPanelLeft(Number.NaN, 39), null);
});

test('shows the floating task panel after controls leave a fitting leaderboard gutter', () => {
    assert.equal(typeof visualization.shouldShowFloatingTaskPanel, 'function');

    assert.equal(visualization.shouldShowFloatingTaskPanel({
        route: 'leaderboard',
        categoryBottom: 64,
        visibleTop: 72,
        panelLeft: 0
    }), true);
    assert.equal(visualization.shouldShowFloatingTaskPanel({
        route: 'taskstore',
        categoryBottom: 64,
        visibleTop: 72,
        panelLeft: 0
    }), false);
    assert.equal(visualization.shouldShowFloatingTaskPanel({
        route: 'leaderboard',
        categoryBottom: 120,
        visibleTop: 72,
        panelLeft: 0
    }), false);
    assert.equal(visualization.shouldShowFloatingTaskPanel({
        route: 'leaderboard',
        categoryBottom: 64,
        visibleTop: 72,
        panelLeft: null
    }), false);
});

test('shows a sticky table header only while the Leaderboard table crosses the navbar', () => {
    assert.equal(typeof visualization.shouldShowStickyTableHeader, 'function');

    assert.equal(visualization.shouldShowStickyTableHeader({
        route: 'leaderboard',
        headerTop: 80,
        tableBottom: 1200,
        visibleTop: 88,
        headerHeight: 114
    }), true);
    assert.equal(visualization.shouldShowStickyTableHeader({
        route: 'leaderboard',
        headerTop: 120,
        tableBottom: 1200,
        visibleTop: 88,
        headerHeight: 114
    }), false);
    assert.equal(visualization.shouldShowStickyTableHeader({
        route: 'leaderboard',
        headerTop: 0,
        tableBottom: 180,
        visibleTop: 88,
        headerHeight: 114
    }), false);
    assert.equal(visualization.shouldShowStickyTableHeader({
        route: 'taskstore',
        headerTop: 0,
        tableBottom: 1200,
        visibleTop: 88,
        headerHeight: 114
    }), false);
    assert.equal(visualization.shouldShowStickyTableHeader({
        route: 'leaderboard',
        headerTop: Number.NaN,
        tableBottom: 1200,
        visibleTop: 88,
        headerHeight: 114
    }), false);
});

test('maps SR averages to a fixed zero-to-one bar scale', () => {
    assert.equal(typeof visualization.getAverageBarWidth, 'function');
    assert.equal(visualization.getAverageBarWidth(0.42, 'sr', 0), 42);
    assert.equal(visualization.getAverageBarWidth(1.4, 'sr', 0), 100);
    assert.equal(visualization.getAverageBarWidth(-1, 'sr', 0), 0);
    assert.equal(visualization.getAverageBarWidth(Number.NaN, 'sr', 0), 0);
});

test('normalizes CC averages against the current maximum', () => {
    assert.equal(typeof visualization.getAverageBarWidth, 'function');
    assert.equal(visualization.getAverageBarWidth(4, 'cc', 8), 50);
    assert.equal(visualization.getAverageBarWidth(12, 'cc', 8), 100);
    assert.equal(visualization.getAverageBarWidth(4, 'cc', 0), 0);
    assert.equal(visualization.getAverageBarWidth(Number.POSITIVE_INFINITY, 'cc', 8), 0);
});

test('keeps task indicators out of the sortable Model header', () => {
    assert.equal(typeof visualization.getModelHeaderHtml, 'function');

    const tasks = [
        { name: 'safe-a', category: 'Safety' },
        { name: 'distractor-a', category: 'Distractor' },
        { name: 'libero', category: 'LIBERO' }
    ];
    const html = visualization.getModelHeaderHtml(
        tasks,
        new Set(['safe-a', 'libero']),
        'desc'
    );

    assert.match(html, /Model ↓/);
    assert.doesNotMatch(html, /task-indicator|data-task-name|<button/);
});

test('toggles exactly one selected task and reports its new state', () => {
    assert.equal(typeof visualization.toggleTaskSelection, 'function');

    const selectedTasks = new Set(['safe-a', 'safe-b']);

    assert.equal(visualization.toggleTaskSelection(selectedTasks, 'safe-a'), false);
    assert.deepEqual([...selectedTasks], ['safe-b']);
    assert.equal(visualization.toggleTaskSelection(selectedTasks, 'safe-a'), true);
    assert.deepEqual([...selectedTasks], ['safe-b', 'safe-a']);
});

test('renders metric-aware average bars with accessible raw values', () => {
    assert.equal(typeof visualization.getAverageBarHtml, 'function');

    const srHtml = visualization.getAverageBarHtml(0.42, 'sr', 0);
    const ccHtml = visualization.getAverageBarHtml(4, 'cc', 8);
    const unavailableHtml = visualization.getAverageBarHtml(-1, 'cc', 0);

    assert.match(srHtml, /class="model-average-bar sr"/);
    assert.match(srHtml, /aria-label="Average SR: 0\.42"/);
    assert.match(srHtml, /style="width: 42%"/);
    assert.match(ccHtml, /class="model-average-bar cc"/);
    assert.match(ccHtml, /aria-label="Average CC: 4\.00"/);
    assert.match(ccHtml, /style="width: 50%"/);
    assert.match(unavailableHtml, /aria-label="Average CC unavailable"/);
    assert.match(unavailableHtml, /style="width: 0%"/);
    assert.doesNotMatch(unavailableHtml, /NaN|Infinity/);
});

test('extracts the selected difficulty score for either metric', () => {
    assert.equal(typeof visualization.getDifficultyScore, 'function');

    const data = {
        sr: [0.2, 0.4, 0.8],
        cc: [3, 6, 12]
    };

    assert.equal(visualization.getDifficultyScore(data, 'sr', 'l0'), 0.2);
    assert.equal(visualization.getDifficultyScore(data, 'sr', 'l1'), 0.4);
    assert.equal(visualization.getDifficultyScore(data, 'sr', 'l2'), 0.8);
    assert.equal(visualization.getDifficultyScore(data, 'sr', 'l1l2'), 0.6);
    assert.equal(visualization.getDifficultyScore(data, 'cc', 'avg'), 7);
    assert.equal(visualization.getDifficultyScore(data, 'cc', 'l3'), null);
    assert.equal(visualization.getDifficultyScore({ sr: [0.2] }, 'sr', 'l2'), null);
});

test('extracts complete SR level scores and averages each level across tasks', () => {
    assert.equal(typeof visualization.getSrLevelScores, 'function');
    assert.equal(typeof visualization.getAverageSrLevelScores, 'function');

    assert.deepEqual(
        visualization.getSrLevelScores({ sr: [0.9, 0.6, 0.3] }),
        { l0: 0.9, l1: 0.6, l2: 0.3 }
    );
    assert.equal(visualization.getSrLevelScores({ sr: [0.9, 0.6] }), null);
    assert.equal(visualization.getSrLevelScores({ sr: [0.9, Number.NaN, 0.3] }), null);

    const tasks = [
        { data: { modelA: { sr: [0.8, 0.4, 0.2] } } },
        { data: { modelA: { sr: [0.6, 0.2, 0.0] } } }
    ];
    assert.deepEqual(
        visualization.getAverageSrLevelScores(tasks, 'modelA'),
        { l0: 0.7, l1: 0.3, l2: 0.1 }
    );
    assert.equal(visualization.getAverageSrLevelScores(tasks, 'missing'), null);
});

test('maps L0-L2 scores to contributions whose total equals Average SR', () => {
    assert.equal(typeof visualization.getSrContributionSegments, 'function');

    const segments = visualization.getSrContributionSegments({
        l0: 0.9,
        l1: 0.6,
        l2: 0.3
    });
    assert.deepEqual(segments, [
        { level: 'L0', score: 0.9, width: 30 },
        { level: 'L1', score: 0.6, width: 20 },
        { level: 'L2', score: 0.3, width: 10 }
    ]);
    assert.equal(segments.reduce((sum, item) => sum + item.width, 0), 60);
    assert.equal(
        visualization.getSrContributionSegments({ l0: 0.9, l1: null, l2: 0.3 }),
        null
    );
    assert.equal(
        visualization.getSrContributionSegments({ l0: 1.1, l1: 0.6, l2: 0.3 }),
        null
    );
});

test('renders Average SR as accessible level contributions with a solid fallback', () => {
    const levels = { l0: 0.9, l1: 0.6, l2: 0.3 };
    const primary = visualization.getAverageBarHtml(
        0.6,
        'sr',
        0,
        'is-primary',
        'Avg',
        levels
    );
    assert.match(primary, /model-average-bar sr is-primary is-segmented/);
    assert.match(primary, /sr-level-segment l0/);
    assert.match(primary, /style="width: 30%"/);
    assert.match(primary, /L0 SR: 0\.90/);
    assert.match(primary, /data-sr-level-label="L0:0\.90"/);
    assert.match(primary, /data-sr-level-label="L1:0\.60"/);
    assert.match(primary, /data-sr-level-label="L2:0\.30"/);
    assert.match(primary, /title="L0 SR: 0\.90"/);
    assert.match(primary, /aria-label="L0 SR: 0\.90"/);
    assert.match(
        primary,
        /Avg SR: 0\.60; L0: 0\.90; L1: 0\.60; L2: 0\.30/
    );

    const secondary = visualization.getAverageBarHtml(
        0.6,
        'sr',
        0,
        'is-secondary',
        'Avg',
        levels
    );
    assert.match(secondary, /model-average-bar sr is-secondary is-segmented/);

    const fallback = visualization.getAverageBarHtml(
        0.6,
        'sr',
        0,
        'is-primary',
        'Avg',
        null
    );
    assert.doesNotMatch(fallback, /is-segmented|sr-level-segment/);
    assert.match(fallback, /model-average-bar-fill/);
});

test('averages SR across selected tasks and CC across selected Safety tasks only', () => {
    assert.equal(typeof visualization.getAverageMetricScores, 'function');

    const tasks = [
        {
            hasCC: true,
            data: {
                modelA: { sr: [0.2, 0.4, 0.6], cc: [2, 4, 6] }
            }
        },
        {
            hasCC: false,
            data: {
                modelA: { sr: [0.6, 0.8, 1.0] }
            }
        },
        {
            hasCC: true,
            data: {}
        }
    ];

    assert.deepEqual(
        visualization.getAverageMetricScores(tasks, 'modelA', 'l1'),
        { sr: 0.6, cc: 4 }
    );
    assert.deepEqual(
        visualization.getAverageMetricScores(tasks, 'missing', 'l1'),
        { sr: null, cc: null }
    );
});

test('renders the primary metric first in color and the Both secondary metric in gray', () => {
    assert.equal(typeof visualization.getMetricSummaryHtml, 'function');

    const srPrimary = visualization.getMetricSummaryHtml(
        { sr: 0.75, cc: 4 },
        'sr',
        true,
        8,
        'Avg'
    );

    assert.ok(srPrimary.indexOf('metric-summary sr is-primary') < srPrimary.indexOf('metric-summary cc is-secondary'));
    assert.match(srPrimary, /0\.75 \(Avg SR\)/);
    assert.match(srPrimary, /4\.00 \(Avg CC\)/);
    assert.match(srPrimary, /model-average-bar sr is-primary/);
    assert.match(srPrimary, /model-average-bar cc is-secondary/);
    assert.match(srPrimary, /style="width: 50%"/);

    const ccPrimary = visualization.getMetricSummaryHtml(
        { sr: 0.75, cc: 4 },
        'cc',
        true,
        8,
        'Task'
    );

    assert.ok(ccPrimary.indexOf('metric-summary cc is-primary') < ccPrimary.indexOf('metric-summary sr is-secondary'));
    assert.match(ccPrimary, /model-average-bar cc is-primary/);
    assert.match(ccPrimary, /model-average-bar sr is-secondary/);

    const primaryOnly = visualization.getMetricSummaryHtml(
        { sr: 0.75, cc: 4 },
        'cc',
        false,
        8,
        'Task'
    );
    assert.match(primaryOnly, /metric-summary cc is-primary/);
    assert.doesNotMatch(primaryOnly, /metric-summary sr/);
});

test('keeps a task sort only while its column remains visible', () => {
    assert.equal(typeof visualization.shouldKeepTaskSort, 'function');

    const selectedTasks = new Set(['safe-a']);
    assert.equal(
        visualization.shouldKeepTaskSort('safe-a', selectedTasks, false),
        true
    );
    assert.equal(
        visualization.shouldKeepTaskSort('safe-b', selectedTasks, true),
        true
    );
    assert.equal(
        visualization.shouldKeepTaskSort('safe-b', selectedTasks, false),
        false
    );
    assert.equal(
        visualization.shouldKeepTaskSort(null, selectedTasks, true),
        false
    );
});

test('sorts by the primary metric with unavailable values always last', () => {
    assert.equal(typeof visualization.compareMetricScores, 'function');

    const srBestFirst = [0.4, null, 0.8].sort((a, b) =>
        visualization.compareMetricScores(a, b, 'sr', 'desc')
    );
    assert.deepEqual(srBestFirst, [0.8, 0.4, null]);

    const ccBestFirst = [4, null, 2].sort((a, b) =>
        visualization.compareMetricScores(a, b, 'cc', 'desc')
    );
    assert.deepEqual(ccBestFirst, [2, 4, null]);

    const srReverse = [0.4, null, 0.8].sort((a, b) =>
        visualization.compareMetricScores(a, b, 'sr', 'asc')
    );
    assert.deepEqual(srReverse, [0.4, 0.8, null]);
    assert.equal(visualization.compareMetricScores(null, null, 'cc', 'desc'), 0);
});
