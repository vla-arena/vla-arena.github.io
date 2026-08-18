(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.ModelLabel = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function renderModelTypeText(modelType) {
        const type = modelType === 'wam' ? 'wam' : 'vla';
        const label = type === 'wam' ? 'World Action Model' : 'Vision-Language-Action model';
        return `<span class="model-type-text type-${type}" aria-label="${label}">${type.toUpperCase()}</span>`;
    }

    return { renderModelTypeText };
}));
