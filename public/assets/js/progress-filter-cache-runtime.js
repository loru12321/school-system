(() => {
    if (typeof window === 'undefined' || window.ProgressFilterCache) return;
    let source = null;
    let signature = '';
    let list = [];
    function apply(rows, options = {}) {
        const nextSource = Array.isArray(rows) ? rows : [];
        const nextSignature = String(options.signature || '');
        if (source === nextSource && signature === nextSignature) return null;
        list = nextSource.slice();
        const { quickMode, type, threshold, sortMode, myClass } = options;
        if (quickMode === 'my_class' && myClass) list = list.filter(item => isClassEquivalent(item.class, myClass));
        else if (quickMode === 'focus') list = list.filter(item => Math.abs(item.change) >= threshold);
        if (type === 'up') list = list.filter(item => item.change > 0);
        if (type === 'down') list = list.filter(item => item.change < 0);
        list.sort((a, b) => {
            switch (sortMode) {
                case 'regress_desc':
                    if (a.change !== b.change) return a.change - b.change;
                    return a.currRank - b.currRank;
                case 'current_rank_asc':
                    if (a.currRank !== b.currRank) return a.currRank - b.currRank;
                    return b.change - a.change;
                case 'class_name_asc': {
                    const classDiff = String(a.class || '').localeCompare(String(b.class || ''), 'zh-CN', { numeric: true });
                    return classDiff || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN', { numeric: true });
                }
                default:
                    if (a.change !== b.change) return b.change - a.change;
                    return a.currRank - b.currRank;
            }
        });
        source = nextSource;
        signature = nextSignature;
        return list;
    }
    window.ProgressFilterCache = { apply };
})();
