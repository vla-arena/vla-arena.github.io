const test = require('node:test');
const assert = require('node:assert/strict');

const {
    getModelTypeValidationError,
    getReleaseMonthValidationError,
    isGithubRepositoryUrl,
    normalizeModelLinks,
    normalizeModelType,
    normalizeReleaseMonth
} = require('./model-metadata.js');

test('normalizes optional model types and validates explicit values', () => {
    assert.equal(normalizeModelType(undefined), 'vla');
    assert.equal(normalizeModelType(null), 'vla');
    assert.equal(normalizeModelType(''), 'vla');
    assert.equal(normalizeModelType('vla'), 'vla');
    assert.equal(normalizeModelType('wam'), 'wam');
    assert.equal(normalizeModelType('VLA'), 'vla');
    assert.equal(normalizeModelType(' wam '), 'vla');
    assert.equal(normalizeModelType('world-model'), 'vla');

    assert.equal(getModelTypeValidationError(undefined), '');
    assert.equal(getModelTypeValidationError(null), '');
    assert.equal(getModelTypeValidationError(''), '');
    assert.equal(getModelTypeValidationError('vla'), '');
    assert.equal(getModelTypeValidationError('wam'), '');
    assert.match(getModelTypeValidationError('VLA'), /lowercase/);
    assert.match(getModelTypeValidationError(' wam '), /leading or trailing whitespace/);
    assert.match(getModelTypeValidationError('world-model'), /vla.*wam/);
    assert.match(getModelTypeValidationError(123), /string, null, or empty string/);
});

test('normalizes only real unpadded YYYY-MM release months', () => {
    assert.equal(normalizeReleaseMonth('2024-06'), '2024-06');
    assert.equal(normalizeReleaseMonth(undefined), '');
    assert.equal(normalizeReleaseMonth(null), '');
    assert.equal(normalizeReleaseMonth(''), '');
    assert.equal(normalizeReleaseMonth(' 2024-06 '), '');
    assert.equal(normalizeReleaseMonth('2024-00'), '');
    assert.equal(normalizeReleaseMonth('2024-13'), '');
    assert.equal(normalizeReleaseMonth('2024-6'), '');
});

test('validates optional release month values without rejecting explicit unknowns', () => {
    assert.equal(getReleaseMonthValidationError(null), '');
    assert.equal(getReleaseMonthValidationError(''), '');
    assert.equal(getReleaseMonthValidationError('2024-06'), '');
    assert.match(getReleaseMonthValidationError('   '), /YYYY-MM/);
    assert.match(getReleaseMonthValidationError(' 2024-06 '), /leading or trailing whitespace/);
    assert.match(getReleaseMonthValidationError(undefined), /string, null, or empty string/);
    assert.match(getReleaseMonthValidationError(202406), /string, null, or empty string/);
    assert.match(getReleaseMonthValidationError('2024-13'), /YYYY-MM/);
});

test('accepts only HTTPS GitHub repository URLs', () => {
    assert.equal(isGithubRepositoryUrl('https://github.com/openvla/openvla'), true);
    assert.equal(isGithubRepositoryUrl('https://github.com/openvla/openvla/'), true);
    assert.equal(isGithubRepositoryUrl('http://github.com/openvla/openvla'), false);
    assert.equal(isGithubRepositoryUrl('https://github.com/openvla'), false);
    assert.equal(isGithubRepositoryUrl('https://github.com/openvla/openvla/tree/main'), false);
    assert.equal(isGithubRepositoryUrl('https://example.com/openvla/openvla'), false);
    assert.equal(isGithubRepositoryUrl(' https://github.com/openvla/openvla '), false);
});

test('normalizes known model links and omits an invalid GitHub URL', () => {
    assert.deepEqual(normalizeModelLinks({
        arena: ' https://huggingface.co/VLA-Arena/model ',
        paper: 'https://arxiv.org/abs/1234.56789',
        huggingface: '',
        github: 'https://github.com/openvla/openvla',
        unrelated: 'https://example.com'
    }), {
        arena: 'https://huggingface.co/VLA-Arena/model',
        paper: 'https://arxiv.org/abs/1234.56789',
        github: 'https://github.com/openvla/openvla'
    });

    assert.deepEqual(normalizeModelLinks({
        github: 'https://example.com/not-github'
    }), {});
});
