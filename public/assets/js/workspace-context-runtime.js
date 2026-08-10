(function installWorkspaceContextRuntime(global) {
    'use strict';

    const STORAGE_PREFIX = 'school:workspace-context:v1';
    const MAX_RECENT_MODULES = 5;
    const MAX_PINNED_MODULES = 6;
    let refreshFrame = 0;
    let initialized = false;

    function normalizeText(value) {
        return String(value == null ? '' : value).trim();
    }

    function readStorage(key) {
        try {
            return global.localStorage?.getItem(key) || '';
        } catch (_) {
            return '';
        }
    }

    function writeStorage(key, value) {
        try {
            global.localStorage?.setItem(key, value);
        } catch (_) {}
    }

    function getCurrentCohortId() {
        const state = global.WorkspaceState;
        if (state && typeof state.getCurrentCohortId === 'function') {
            const value = normalizeText(state.getCurrentCohortId());
            if (value) return value;
        }
        return normalizeText(global.CURRENT_COHORT_ID)
            || normalizeText(global.document?.getElementById('cohort-selector')?.value);
    }

    function getStorageKey() {
        return `${STORAGE_PREFIX}:${getCurrentCohortId() || 'unselected'}`;
    }

    function readContextState() {
        try {
            const value = JSON.parse(readStorage(getStorageKey()) || '{}');
            return {
                recent: Array.isArray(value.recent) ? value.recent.map(normalizeText).filter(Boolean).slice(0, MAX_RECENT_MODULES) : [],
                pinned: Array.isArray(value.pinned) ? value.pinned.map(normalizeText).filter(Boolean).slice(0, MAX_PINNED_MODULES) : []
            };
        } catch (_) {
            return { recent: [], pinned: [] };
        }
    }

    function writeContextState(next) {
        const state = {
            recent: Array.from(new Set(Array.isArray(next?.recent) ? next.recent : [])).slice(0, MAX_RECENT_MODULES),
            pinned: Array.from(new Set(Array.isArray(next?.pinned) ? next.pinned : [])).slice(0, MAX_PINNED_MODULES)
        };
        writeStorage(getStorageKey(), JSON.stringify(state));
        return state;
    }

    function getNavigation() {
        return global.NAV_STRUCTURE && typeof global.NAV_STRUCTURE === 'object' ? global.NAV_STRUCTURE : {};
    }

    function canShowModule(id) {
        if (!id) return true;
        if (typeof global.canAccessModule === 'function' && !global.canAccessModule(id)) return false;
        if (id === 'indicator'
            && typeof global.isIndicatorModuleVisible === 'function'
            && !global.isIndicatorModuleVisible()) return false;
        if (id === 'report-generator' && global.CONFIG && !global.CONFIG.showQuery) return false;
        return true;
    }

    function getModules(categoryKey = '') {
        const navigation = getNavigation();
        const categories = categoryKey && navigation[categoryKey]
            ? [[categoryKey, navigation[categoryKey]]]
            : Object.entries(navigation);
        const byId = new Map();
        categories.forEach(([key, category]) => {
            (Array.isArray(category?.items) ? category.items : []).forEach((item) => {
                const id = normalizeText(item?.id);
                if (!id || !canShowModule(id) || byId.has(id)) return;
                byId.set(id, {
                    id,
                    text: normalizeText(item.text) || id,
                    hint: normalizeText(item.hint),
                    icon: normalizeText(item.icon) || 'ti-layout-grid',
                    categoryKey: key
                });
            });
        });
        return Array.from(byId.values());
    }

    function getCurrentCategoryKey() {
        const value = typeof global.getCurrentNavCategory === 'function'
            ? global.getCurrentNavCategory()
            : '';
        return normalizeText(value) || 'data';
    }

    function getActiveModuleId() {
        return normalizeText(global.document?.querySelector('.section.active[id]')?.id);
    }

    function getCohortLabel() {
        const id = getCurrentCohortId();
        const selector = global.document?.getElementById('cohort-selector');
        const option = selector && Array.from(selector.options || []).find((candidate) => candidate.value === id);
        const selected = normalizeText(option?.textContent);
        if (selected && !/^选择届别$/.test(selected)) return selected;
        return id ? `${id}届` : '未选择届别';
    }

    function getExamLabel() {
        const examId = normalizeText(global.CURRENT_EXAM_ID);
        if (!examId) return '未选择考试';
        const entry = global.COHORT_DB?.exams?.[examId] || {};
        const meta = entry?.meta && typeof entry.meta === 'object' ? entry.meta : entry;
        const title = normalizeText(meta?.name)
            || normalizeText(meta?.title)
            || normalizeText(meta?.label)
            || normalizeText(meta?.examName)
            || normalizeText(meta?.type);
        const date = normalizeText(meta?.date);
        if (title && date && !title.includes(date)) return `${title} · ${date}`;
        return title || examId;
    }

    function getSyncStatus() {
        const chip = global.document?.getElementById('shell-sync-chip');
        return {
            text: normalizeText(chip?.querySelector('[data-sync-label]')?.textContent) || '同步状态待确认',
            tone: normalizeText(chip?.dataset?.syncState)
        };
    }

    function getTeacherStatus() {
        const count = global.TEACHER_MAP && typeof global.TEACHER_MAP === 'object'
            ? Object.keys(global.TEACHER_MAP).length
            : 0;
        if (!count) return { text: '任课表待同步', tone: 'warning' };
        return { text: `任课表 ${count} 项`, tone: 'positive' };
    }

    function getQualityStatus() {
        const result = global.document?.getElementById('data-quality')?.__dataQualityLastResult;
        if (!result || typeof result !== 'object') return { text: '数据体检未运行', tone: 'warning' };
        if (!Number(result.issueCount || 0)) return { text: '数据体检通过', tone: 'positive' };
        return { text: `${Number(result.issueCount)} 条待处理`, tone: 'warning' };
    }

    function getScoreStatus() {
        const count = Array.isArray(global.RAW_DATA) ? global.RAW_DATA.length : 0;
        return { text: count ? `${count.toLocaleString('zh-CN')} 条成绩` : '成绩未恢复', tone: count ? 'positive' : 'warning' };
    }

    function createElement(tagName, className, text) {
        const element = global.document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function appendIcon(parent, name) {
        const icon = createElement('i', `ti ${name || 'ti-layout-grid'}`);
        icon.setAttribute('aria-hidden', 'true');
        parent.appendChild(icon);
    }

    function createStatus(text, icon, tone) {
        const status = createElement('span', `workspace-context-status${tone ? ` is-${tone}` : ''}`);
        appendIcon(status, icon);
        status.appendChild(global.document.createTextNode(text));
        return status;
    }

    function findModuleById(id) {
        return getModules().find((item) => item.id === id) || null;
    }

    function createModuleButton(module, options = {}) {
        const button = createElement('button', `workspace-context-module${options.active ? ' is-active' : ''}`);
        button.type = 'button';
        button.dataset.contextModule = module.id;
        button.title = module.hint || module.text;
        if (options.active) button.setAttribute('aria-current', 'page');
        appendIcon(button, module.icon);
        button.appendChild(global.document.createTextNode(module.text));
        return button;
    }

    function createPinButton(module, pinned) {
        const button = createElement('button', 'workspace-context-pin');
        button.type = 'button';
        button.dataset.contextPin = module.id;
        button.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        button.setAttribute('aria-label', pinned ? `取消固定${module.text}` : `固定${module.text}`);
        button.title = pinned ? '取消固定' : '固定到快捷区';
        appendIcon(button, pinned ? 'ti-pinned-off' : 'ti-pin');
        return button;
    }

    function createModuleList(modules, state, activeId, withPins) {
        const list = createElement('div', 'workspace-context-module-list');
        modules.forEach((module) => {
            // Keep each shortcut and its optional pin control in one compact
            // interaction unit. Rendering the pin as a separate tile created a
            // row of unexplained empty boxes in dense workspaces.
            const entry = createElement('div', 'workspace-context-module-entry');
            entry.appendChild(createModuleButton(module, { active: module.id === activeId }));
            if (withPins) entry.appendChild(createPinButton(module, state.pinned.includes(module.id)));
            list.appendChild(entry);
        });
        return list;
    }

    function createGroup(label, modules, state, activeId, withPins) {
        const group = createElement('section', 'workspace-context-group');
        group.appendChild(createElement('span', 'workspace-context-group__label', label));
        if (modules.length) group.appendChild(createModuleList(modules, state, activeId, withPins));
        return group;
    }

    function recordModule(moduleId) {
        const id = normalizeText(moduleId);
        if (!id || !findModuleById(id)) return;
        const state = readContextState();
        state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, MAX_RECENT_MODULES);
        writeContextState(state);
    }

    function togglePinnedModule(moduleId) {
        const id = normalizeText(moduleId);
        if (!id || !findModuleById(id)) return;
        const state = readContextState();
        if (state.pinned.includes(id)) {
            state.pinned = state.pinned.filter((item) => item !== id);
        } else {
            state.pinned = [id, ...state.pinned.filter((item) => item !== id)].slice(0, MAX_PINNED_MODULES);
        }
        writeContextState(state);
        scheduleRefresh();
    }

    function activateModule(moduleId) {
        const id = normalizeText(moduleId);
        if (!id || !canShowModule(id) || typeof global.switchTab !== 'function') return;
        global.switchTab(id);
    }

    function render() {
        const root = global.document?.getElementById('workspace-context-bar');
        if (!root) return;
        const state = readContextState();
        const activeId = getActiveModuleId();
        const categoryKey = getCurrentCategoryKey();
        const category = getNavigation()[categoryKey] || {};
        const currentModules = getModules(categoryKey).slice(0, 5);
        const pinnedModules = state.pinned.map(findModuleById).filter(Boolean);
        const recentModules = state.recent.map(findModuleById).filter(Boolean).filter((item) => !state.pinned.includes(item.id));

        const summary = createElement('div', 'workspace-context-summary');
        summary.appendChild(createElement('span', 'workspace-context-kicker', category.title || '当前任务'));
        summary.appendChild(createElement('strong', 'workspace-context-title', `${getCohortLabel()} · ${getExamLabel()}`));

        const statuses = createElement('div', 'workspace-context-statuses');
        const sync = getSyncStatus();
        statuses.appendChild(createStatus(sync.text, 'ti-cloud', sync.tone === 'synced' ? 'positive' : (sync.tone === 'error' ? 'warning' : '')));
        const score = getScoreStatus();
        statuses.appendChild(createStatus(score.text, 'ti-database', score.tone));
        const teacher = getTeacherStatus();
        statuses.appendChild(createStatus(teacher.text, 'ti-users', teacher.tone));
        const quality = getQualityStatus();
        statuses.appendChild(createStatus(quality.text, 'ti-stethoscope', quality.tone));

        const groups = createElement('div', 'workspace-context-task-groups');
        groups.appendChild(createGroup('当前工作区', currentModules, state, activeId, true));
        if (pinnedModules.length) groups.appendChild(createGroup('固定', pinnedModules, state, activeId, true));
        if (recentModules.length) groups.appendChild(createGroup('最近访问', recentModules, state, activeId, false));

        root.replaceChildren(summary, statuses, groups);
    }

    function scheduleRefresh() {
        if (refreshFrame) return;
        const run = () => {
            refreshFrame = 0;
            render();
        };
        if (typeof global.requestAnimationFrame === 'function') {
            refreshFrame = global.requestAnimationFrame(run);
        } else {
            refreshFrame = global.setTimeout(run, 40);
        }
    }

    function bind() {
        if (initialized || !global.document) return;
        initialized = true;
        global.document.addEventListener('click', (event) => {
            const pin = event.target?.closest?.('[data-context-pin]');
            if (pin) {
                event.preventDefault();
                event.stopPropagation();
                togglePinnedModule(pin.dataset.contextPin);
                return;
            }
            const module = event.target?.closest?.('[data-context-module]');
            if (module) activateModule(module.dataset.contextModule);
        });
        global.addEventListener('school:module-changed', (event) => {
            recordModule(event?.detail?.id);
            scheduleRefresh();
        });
        ['school:app-modules-ready', 'school:login-workbench-ready', 'cloud-load-state', 'cloud-sync-state'].forEach((eventName) => {
            global.addEventListener(eventName, scheduleRefresh);
        });
        global.addEventListener('storage', scheduleRefresh);
        global.setTimeout(scheduleRefresh, 0);
        global.setTimeout(scheduleRefresh, 260);
    }

    if (global.document?.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', bind, { once: true });
    } else {
        bind();
    }

    global.WorkspaceContextRuntime = Object.freeze({
        render,
        refresh: scheduleRefresh,
        recordModule,
        togglePinnedModule,
        getState: readContextState
    });
}(window));
