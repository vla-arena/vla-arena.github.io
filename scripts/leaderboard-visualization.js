(function (root, factory) {
    const visualization = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = visualization;
    }

    if (root) {
        root.LeaderboardVisualization = visualization;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function getTaskIndicatorGroups(tasks, selectedTasks) {
        const groups = [];
        const groupsByCategory = new Map();
        const visibleCategories = new Set([
            'Safety',
            'Distractor',
            'Extrapolation',
            'Long Horizon'
        ]);

        tasks.forEach(task => {
            if (!visibleCategories.has(task.category)) {
                return;
            }

            if (!groupsByCategory.has(task.category)) {
                const group = {
                    category: task.category,
                    categoryClass: task.category.toLowerCase().replace(/\s+/g, '-'),
                    tasks: []
                };
                groupsByCategory.set(task.category, group);
                groups.push(group);
            }

            groupsByCategory.get(task.category).tasks.push({
                name: task.name,
                selected: selectedTasks.has(task.name)
            });
        });

        return groups;
    }

    function getAverageBarWidth(score, metric, maxCc) {
        if (!Number.isFinite(score) || score < 0) {
            return 0;
        }

        const ratio = metric === 'cc'
            ? (Number.isFinite(maxCc) && maxCc > 0 ? score / maxCc : 0)
            : score;

        return Math.max(0, Math.min(100, ratio * 100));
    }

    function average(values) {
        if (values.length === 0) {
            return null;
        }
        const value = values.reduce((sum, entry) => sum + entry, 0) / values.length;
        return Number(value.toFixed(12));
    }

    function getDifficultyScore(data, metric, difficulty) {
        if (!data || (metric !== 'sr' && metric !== 'cc')) {
            return null;
        }

        const values = data[metric];
        if (!Array.isArray(values)) {
            return null;
        }

        const indexesByDifficulty = {
            l0: [0],
            l1: [1],
            l2: [2],
            l1l2: [1, 2],
            avg: [0, 1, 2]
        };
        const indexes = indexesByDifficulty[difficulty];
        if (!indexes) {
            return null;
        }

        const selectedValues = indexes.map(index => values[index]);
        if (selectedValues.some(value => !Number.isFinite(value))) {
            return null;
        }
        return average(selectedValues);
    }

    function getSrLevelScores(data) {
        if (!data || !Array.isArray(data.sr) || data.sr.length < 3) {
            return null;
        }

        const [l0, l1, l2] = data.sr;
        if (![l0, l1, l2].every(Number.isFinite)) {
            return null;
        }

        return { l0, l1, l2 };
    }

    function getAverageSrLevelScores(tasks, modelId) {
        const scoresByLevel = {
            l0: [],
            l1: [],
            l2: []
        };

        tasks.forEach(task => {
            const taskData = task && task.data ? task.data[modelId] : null;
            const levelScores = getSrLevelScores(taskData);
            if (!levelScores) {
                return;
            }

            scoresByLevel.l0.push(levelScores.l0);
            scoresByLevel.l1.push(levelScores.l1);
            scoresByLevel.l2.push(levelScores.l2);
        });

        const levelAverages = {
            l0: average(scoresByLevel.l0),
            l1: average(scoresByLevel.l1),
            l2: average(scoresByLevel.l2)
        };

        return Object.values(levelAverages).every(Number.isFinite)
            ? levelAverages
            : null;
    }

    function getSrContributionSegments(levelScores) {
        const levels = [
            ['L0', 'l0'],
            ['L1', 'l1'],
            ['L2', 'l2']
        ];

        if (!levelScores || levels.some(([, key]) => {
            const score = levelScores[key];
            return !Number.isFinite(score) || score < 0 || score > 1;
        })) {
            return null;
        }

        return levels.map(([level, key]) => {
            const score = levelScores[key];
            return {
                level,
                score,
                width: Number(((score / 3) * 100).toFixed(2))
            };
        });
    }

    function getAverageMetricScores(tasks, modelId, difficulty) {
        const srScores = [];
        const ccScores = [];

        tasks.forEach(task => {
            const taskData = task && task.data ? task.data[modelId] : null;
            const srScore = getDifficultyScore(taskData, 'sr', difficulty);
            if (srScore !== null) {
                srScores.push(srScore);
            }

            if (task && task.hasCC) {
                const ccScore = getDifficultyScore(taskData, 'cc', difficulty);
                if (ccScore !== null) {
                    ccScores.push(ccScore);
                }
            }
        });

        return {
            sr: average(srScores),
            cc: average(ccScores)
        };
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getTaskIndicatorMapHtml(tasks, selectedTasks) {
        const groupsHtml = getTaskIndicatorGroups(tasks, selectedTasks)
            .map(group => {
                const taskButtons = group.tasks.map(task => {
                    const category = escapeHtml(group.category);
                    const taskName = escapeHtml(task.name);
                    const selectedClass = task.selected ? ' is-selected' : '';

                    return `
                        <button class="task-indicator ${group.categoryClass}${selectedClass}"
                                type="button"
                                data-task-name="${taskName}"
                                aria-label="${category}: ${taskName}"
                                title="${category}: ${taskName}"
                                aria-pressed="${task.selected}">
                            <span class="task-indicator-tooltip">${category}: ${taskName}</span>
                        </button>
                    `;
                }).join('');

                return `
                    <div class="task-indicator-group ${group.categoryClass}"
                         aria-label="${escapeHtml(group.category)} tasks">
                        ${taskButtons}
                    </div>
                `;
            }).join('');

        return `
            <div class="task-indicator-map" aria-label="Selected benchmark tasks">
                ${groupsHtml}
            </div>
        `;
    }

    function getModelHeaderHtml(tasks, selectedTasks, sortDirection = null) {
        const sortArrow = sortDirection === 'desc'
            ? ' ↓'
            : (sortDirection === 'asc' ? ' ↑' : '');

        return `
            <span class="model-sort-label">Model${sortArrow}</span>
        `;
    }

    function getFloatingTaskPanelLeft(tableLeft, panelWidth, margin = 0) {
        if (!Number.isFinite(tableLeft)
            || !Number.isFinite(panelWidth)
            || !Number.isFinite(margin)
            || tableLeft < 0
            || panelWidth <= 0
            || margin < 0
            || tableLeft < panelWidth + (2 * margin)) {
            return null;
        }

        return (tableLeft - panelWidth) / 2;
    }

    function shouldShowFloatingTaskPanel({ route, categoryBottom, visibleTop, panelLeft }) {
        return route === 'leaderboard'
            && Number.isFinite(categoryBottom)
            && Number.isFinite(visibleTop)
            && Number.isFinite(panelLeft)
            && categoryBottom <= visibleTop;
    }

    function shouldShowStickyTableHeader({
        route,
        headerTop,
        tableBottom,
        visibleTop,
        headerHeight
    }) {
        return route === 'leaderboard'
            && [headerTop, tableBottom, visibleTop, headerHeight].every(Number.isFinite)
            && headerHeight > 0
            && headerTop <= visibleTop
            && tableBottom > visibleTop + headerHeight;
    }

    function toggleTaskSelection(selectedTasks, taskName) {
        if (selectedTasks.has(taskName)) {
            selectedTasks.delete(taskName);
            return false;
        }

        selectedTasks.add(taskName);
        return true;
    }

    function shouldKeepTaskSort(taskName, selectedTasks, showOtherData) {
        if (!taskName || !(selectedTasks instanceof Set)) {
            return false;
        }
        return selectedTasks.has(taskName) || Boolean(showOtherData);
    }

    function compareMetricScores(a, b, metric, direction) {
        const hasA = Number.isFinite(a);
        const hasB = Number.isFinite(b);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;

        const bestFirst = direction === 'desc';
        if (metric === 'cc') {
            return bestFirst ? a - b : b - a;
        }
        return bestFirst ? b - a : a - b;
    }

    function getAverageBarHtml(
        score,
        metric,
        maxCc,
        tone = '',
        contextLabel = 'Average',
        srLevelScores = null
    ) {
        const normalizedMetric = metric === 'cc' ? 'cc' : 'sr';
        const metricLabel = normalizedMetric.toUpperCase();
        const hasScore = Number.isFinite(score) && score >= 0;
        const width = Number(getAverageBarWidth(score, normalizedMetric, maxCc).toFixed(2));
        const toneClass = tone ? ` ${tone}` : '';
        const srSegments = normalizedMetric === 'sr'
            ? getSrContributionSegments(srLevelScores)
            : null;
        const ariaLabel = hasScore
            ? `${contextLabel} ${metricLabel}: ${score.toFixed(2)}`
            : `${contextLabel} ${metricLabel} unavailable`;

        if (hasScore && srSegments) {
            const levelDescription = srSegments
                .map(segment => `${segment.level}: ${segment.score.toFixed(2)}`)
                .join('; ');
            const segmentsHtml = srSegments.map(segment => {
                const levelClass = segment.level.toLowerCase();
                const label = `${segment.level} SR: ${segment.score.toFixed(2)}`;
                const visualLabel = `${segment.level}:${segment.score.toFixed(2)}`;
                return `
                    <span class="sr-level-segment ${levelClass}"
                          style="width: ${segment.width}%"
                          tabindex="0"
                          title="${label}"
                          data-sr-level-label="${visualLabel}"
                          aria-label="${label}"></span>
                `;
            }).join('');

            return `
                <div class="model-average-bar ${normalizedMetric}${toneClass} is-segmented"
                     role="img"
                     aria-label="${ariaLabel}; ${levelDescription}">
                    ${segmentsHtml}
                </div>
            `;
        }

        return `
            <div class="model-average-bar ${normalizedMetric}${toneClass}"
                 role="img"
                 aria-label="${ariaLabel}">
                <span class="model-average-bar-fill" style="width: ${width}%"></span>
            </div>
        `;
    }

    function getMetricSummaryHtml(
        scores,
        primaryMetric,
        showBoth,
        maxCc,
        contextLabel,
        srLevelScores = null
    ) {
        const primary = primaryMetric === 'cc' ? 'cc' : 'sr';
        const secondary = primary === 'sr' ? 'cc' : 'sr';
        const metrics = [primary];

        if (showBoth && Number.isFinite(scores && scores[secondary])) {
            metrics.push(secondary);
        }

        return metrics.map((metric, index) => {
            const score = scores && Number.isFinite(scores[metric]) ? scores[metric] : null;
            const tone = index === 0 ? 'is-primary' : 'is-secondary';
            const scoreText = score === null ? 'N/A' : score.toFixed(2);
            const metricLabel = metric.toUpperCase();

            return `
                <div class="metric-summary ${metric} ${tone}">
                    <div class="model-score">${scoreText} (${contextLabel} ${metricLabel})</div>
                    ${getAverageBarHtml(
                        score,
                        metric,
                        maxCc,
                        tone,
                        contextLabel,
                        metric === 'sr' ? srLevelScores : null
                    )}
                </div>
            `;
        }).join('');
    }

    return {
        getTaskIndicatorGroups,
        getTaskIndicatorMapHtml,
        getFloatingTaskPanelLeft,
        shouldShowFloatingTaskPanel,
        shouldShowStickyTableHeader,
        getAverageBarWidth,
        getDifficultyScore,
        getSrLevelScores,
        getAverageSrLevelScores,
        getSrContributionSegments,
        getAverageMetricScores,
        getModelHeaderHtml,
        toggleTaskSelection,
        shouldKeepTaskSort,
        compareMetricScores,
        getAverageBarHtml,
        getMetricSummaryHtml
    };
}));
