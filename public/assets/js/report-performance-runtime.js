(() => {
    if (typeof window === 'undefined' || window.StudentReportPerformance) return;

    const HISTORY_TTL_MS = 2 * 60 * 1000;
    const HTML_TTL_MS = 90 * 1000;
    const MAX_ENTRIES = 80;
    const state = {
        history: new Map(),
        html: new Map()
    };

    function clone(value) {
        if (value == null) return value;
        if (typeof value !== 'object') return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return value;
        }
    }

    function read(map, key, options = {}) {
        const text = String(key || '');
        if (!text) return null;
        const item = map.get(text);
        if (!item) return null;
        if (Date.now() - item.at > item.ttl) {
            map.delete(text);
            return null;
        }
        return options.clone === false ? item.value : clone(item.value);
    }

    function write(map, key, value, ttl, options = {}) {
        const text = String(key || '');
        if (!text) return value;
        map.set(text, { at: Date.now(), ttl, value: options.clone === false ? value : clone(value) });
        while (map.size > MAX_ENTRIES) {
            const first = map.keys().next().value;
            if (!first) break;
            map.delete(first);
        }
        return value;
    }

    function clear(pattern = '') {
        const text = String(pattern || '').trim();
        const clearMap = (map) => {
            if (!text) {
                map.clear();
                return;
            }
            Array.from(map.keys()).forEach((key) => {
                if (String(key).includes(text)) map.delete(key);
            });
        };
        clearMap(state.history);
        clearMap(state.html);
    }

    window.StudentReportPerformance = {
        getHistory(key) {
            return read(state.history, key, { clone: false });
        },
        setHistory(key, value) {
            return write(state.history, key, value, HISTORY_TTL_MS, { clone: false });
        },
        getReportHtml(key) {
            return read(state.html, key);
        },
        setReportHtml(key, value) {
            return write(state.html, key, value, HTML_TTL_MS);
        },
        clear,
        getStats() {
            return {
                history: state.history.size,
                html: state.html.size
            };
        }
    };
})();
