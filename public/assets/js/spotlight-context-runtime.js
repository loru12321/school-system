(function installSpotlightContextRuntime(global) {
    'use strict';

    let fuseInstance = null;

    function normalizeText(value) {
        return String(value == null ? '' : value).trim();
    }

    function getResultsRoot() {
        return global.document?.getElementById('spotlight-results') || null;
    }

    function getInput() {
        return global.document?.getElementById('spotlight-input') || null;
    }

    function canShowModule(id) {
        if (!id) return false;
        if (typeof global.canAccessModule === 'function' && !global.canAccessModule(id)) return false;
        if (id === 'indicator'
            && typeof global.isIndicatorModuleVisible === 'function'
            && !global.isIndicatorModuleVisible()) return false;
        if (id === 'report-generator' && global.CONFIG && !global.CONFIG.showQuery) return false;
        return true;
    }

    function getCategories() {
        const navigation = global.NAV_STRUCTURE && typeof global.NAV_STRUCTURE === 'object'
            ? global.NAV_STRUCTURE
            : {};
        return Object.entries(navigation).map(([key, category]) => ({
            key,
            title: normalizeText(category?.title),
            items: (Array.isArray(category?.items) ? category.items : [])
                .map((item) => ({
                    id: normalizeText(item?.id),
                    text: normalizeText(item?.text) || normalizeText(item?.id),
                    hint: normalizeText(item?.hint),
                    icon: normalizeText(item?.icon) || 'ti-layout-grid',
                    categoryTitle: normalizeText(category?.title)
                }))
                .filter((item) => item.id && canShowModule(item.id))
        })).filter((category) => category.items.length);
    }

    function createNode(tagName, className, text) {
        const node = global.document.createElement(tagName);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function appendIcon(parent, icon) {
        const node = createNode('i', `ti ${icon || 'ti-layout-grid'}`);
        node.setAttribute('aria-hidden', 'true');
        parent.appendChild(node);
    }

    function createGroup(label) {
        const node = createNode('div', 'spotlight-group-label', label);
        node.setAttribute('role', 'presentation');
        return node;
    }

    function createItem({ primary, secondary = '', icon = 'ti-layout-grid', badge = '', onSelect }) {
        const item = createNode('button', 'spotlight-item');
        item.type = 'button';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');

        const copy = createNode('span', 'spotlight-item__copy');
        const title = createNode('span', 'spotlight-item__title');
        appendIcon(title, icon);
        title.appendChild(global.document.createTextNode(primary));
        copy.appendChild(title);
        if (secondary) copy.appendChild(createNode('small', 'spotlight-item__meta', secondary));

        const action = createNode('span', 'spotlight-item__action', badge || '进入');
        item.append(copy, action);
        item.addEventListener('click', () => {
            if (typeof onSelect === 'function') onSelect();
        });
        return item;
    }

    function appendModuleItems(fragment, modules, options = {}) {
        modules.forEach((module) => {
            fragment.appendChild(createItem({
                primary: module.text,
                secondary: options.showCategory ? module.categoryTitle : (module.hint || module.categoryTitle),
                icon: module.icon,
                badge: options.badge || '进入',
                onSelect: () => {
                    if (typeof global.switchTab === 'function') global.switchTab(module.id);
                    if (typeof global.closeSpotlight === 'function') global.closeSpotlight();
                }
            }));
        });
    }

    function renderDefault(categories) {
        const root = getResultsRoot();
        if (!root) return;
        const fragment = global.document.createDocumentFragment();
        const currentCategoryKey = normalizeText(
            typeof global.getCurrentNavCategory === 'function' ? global.getCurrentNavCategory() : ''
        );
        const used = new Set();
        const currentCategory = categories.find((category) => category.key === currentCategoryKey);
        if (currentCategory) {
            currentCategory.items.forEach((item) => used.add(item.id));
            fragment.appendChild(createGroup(`当前工作区 · ${currentCategory.title}`));
            appendModuleItems(fragment, currentCategory.items, { badge: '当前' });
        }

        categories.forEach((category) => {
            const remaining = category.items.filter((item) => !used.has(item.id));
            if (!remaining.length) return;
            remaining.forEach((item) => used.add(item.id));
            fragment.appendChild(createGroup(category.title || '功能'));
            appendModuleItems(fragment, remaining);
        });

        root.replaceChildren(fragment);
    }

    function getSearchableModules(categories) {
        return categories.flatMap((category) => category.items.map((item) => ({
            ...item,
            searchText: [item.text, item.hint, item.id, category.title]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
        })));
    }

    function ensureFuseIndex() {
        const rows = Array.isArray(global.RAW_DATA) ? global.RAW_DATA : [];
        if (!global.Fuse || !rows.length) return null;
        if (!fuseInstance) {
            fuseInstance = new global.Fuse(rows, {
                keys: ['name', 'id', 'class', 'school'],
                threshold: 0.3,
                distance: 100,
                ignoreLocation: true,
                minMatchCharLength: 2
            });
        }
        return fuseInstance;
    }

    function getStudentMatches(query) {
        const rows = Array.isArray(global.RAW_DATA) ? global.RAW_DATA : [];
        const fuse = ensureFuseIndex();
        let matches = fuse
            ? fuse.search(query).map((result) => result.item).slice(0, 8)
            : rows.filter((student) => (
                String(student?.name || '').includes(query)
                || String(student?.id || '').includes(query)
            )).slice(0, 5);
        if (global.PermissionPolicy && typeof global.PermissionPolicy.filterStudentRows === 'function') {
            const currentUser = typeof global.getCurrentUser === 'function'
                ? global.getCurrentUser()
                : global.AuthState?.getCurrentUser?.() || global.Auth?.currentUser || null;
            matches = global.PermissionPolicy.filterStudentRows(currentUser, matches);
        }
        return matches;
    }

    function renderSearch(query, categories) {
        const root = getResultsRoot();
        if (!root) return;
        const fragment = global.document.createDocumentFragment();
        const modules = getSearchableModules(categories)
            .filter((module) => module.searchText.includes(query.toLowerCase()));
        const students = getStudentMatches(query);

        if (modules.length) {
            fragment.appendChild(createGroup(`功能 · ${modules.length} 项`));
            appendModuleItems(fragment, modules, { showCategory: true, badge: '跳转' });
        }
        if (students.length) {
            fragment.appendChild(createGroup(`学生 · ${students.length} 人`));
            students.forEach((student) => {
                const name = normalizeText(student?.name) || '未命名学生';
                const schoolClass = [normalizeText(student?.school), normalizeText(student?.class)].filter(Boolean).join(' ');
                const total = Number(student?.total);
                fragment.appendChild(createItem({
                    primary: name,
                    secondary: schoolClass || '学生',
                    icon: 'ti-user-search',
                    badge: Number.isFinite(total) ? `${total} 分` : '查看',
                    onSelect: () => {
                        if (typeof global.jumpToStudent === 'function') {
                            global.jumpToStudent(name, normalizeText(student?.school), normalizeText(student?.class));
                        }
                    }
                }));
            });
        }
        if (!modules.length && !students.length) {
            const empty = createNode('div', 'spotlight-empty', '没有匹配的功能或学生');
            empty.setAttribute('role', 'status');
            fragment.appendChild(empty);
        }
        root.replaceChildren(fragment);
    }

    function doSpotlightSearch() {
        const query = normalizeText(getInput()?.value);
        const categories = getCategories();
        if (!query) {
            renderDefault(categories);
            return;
        }
        renderSearch(query, categories);
    }

    function updateSpotlightSelection(items, index) {
        Array.from(items || []).forEach((item, itemIndex) => {
            const active = itemIndex === index;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            if (active) item.scrollIntoView({ block: 'nearest' });
        });
    }

    function invalidateIndex() {
        fuseInstance = null;
    }

    Object.assign(global, {
        doSpotlightSearch,
        updateSpotlightSelection,
        SpotlightRuntime: Object.freeze({
            doSpotlightSearch,
            invalidateIndex
        })
    });
}(window));
