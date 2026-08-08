(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.ModelMetadata = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const releaseMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

    function normalizeReleaseMonth(value) {
        if (typeof value !== 'string' || value !== value.trim()) {
            return '';
        }
        return releaseMonthPattern.test(value) ? value : '';
    }

    function getReleaseMonthValidationError(value) {
        if (value === null || value === '') {
            return '';
        }
        if (typeof value !== 'string') {
            return 'Model "releaseMonth" must be a string, null, or empty string when present';
        }
        if (!value.trim()) {
            return 'Model "releaseMonth" must be empty or use YYYY-MM with a real month';
        }
        if (value !== value.trim()) {
            return 'Model "releaseMonth" must not contain leading or trailing whitespace';
        }
        if (!releaseMonthPattern.test(value)) {
            return 'Model "releaseMonth" must use YYYY-MM with a real month';
        }
        return '';
    }

    function isGithubRepositoryUrl(value) {
        if (typeof value !== 'string' || !value || value !== value.trim()) {
            return false;
        }

        try {
            const url = new URL(value);
            const pathParts = url.pathname.split('/').filter(Boolean);
            return url.protocol === 'https:'
                && url.hostname.toLowerCase() === 'github.com'
                && pathParts.length === 2
                && !url.search
                && !url.hash;
        } catch {
            return false;
        }
    }

    function normalizeModelLinks(links) {
        if (!links || typeof links !== 'object' || Array.isArray(links)) {
            return {};
        }

        const normalized = {};
        ['arena', 'paper', 'huggingface'].forEach(key => {
            const value = links[key];
            if (typeof value === 'string' && value.trim()) {
                normalized[key] = value.trim();
            }
        });

        if (isGithubRepositoryUrl(links.github)) {
            normalized.github = links.github;
        }

        return normalized;
    }

    return {
        getReleaseMonthValidationError,
        isGithubRepositoryUrl,
        normalizeModelLinks,
        normalizeReleaseMonth
    };
}));
