const test = require('node:test');
const assert = require('node:assert/strict');

const { renderModelTypeText } = require('./model-label.js');

test('renders plain visible VLA and WAM text with accessible names', () => {
    const vlaText = renderModelTypeText('vla');
    const wamText = renderModelTypeText('wam');

    assert.equal(
        vlaText,
        '<span class="model-type-text type-vla" aria-label="Vision-Language-Action model">VLA</span>'
    );
    assert.equal(
        wamText,
        '<span class="model-type-text type-wam" aria-label="World Action Model">WAM</span>'
    );

    for (const text of [vlaText, wamText]) {
        assert.doesNotMatch(text, /<svg|title=|model-type-icon|model-type-badge/);
    }
});
