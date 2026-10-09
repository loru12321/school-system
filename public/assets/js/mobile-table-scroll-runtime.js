/**
 * Mobile Table Scroll Indicators
 * Adds visual indicators for horizontally scrollable tables
 */

(function (root) {
    'use strict';

    const TableScrollIndicators = {
        _listenersAttached: false,
        init: function () {
            if (!this.isMobileArchitecture()) {
                return;
            }

            this.attachScrollListeners();
            this.refreshAllTables();

            // Watch for new tables
            if (typeof MutationObserver !== 'undefined') {
                this.observeTableChanges();
            }
        },

        isMobileArchitecture: function () {
            return document.body.dataset.mobileArchitecture === 'apk-v2';
        },

        attachScrollListeners: function () {
            if (this._listenersAttached) return;
            this._listenersAttached = true;
            document.addEventListener('scroll', this.handleTableScroll.bind(this), { passive: true, capture: true });
        },

        classifyTable: function (table) {
            if (!table) return 'list';
            const explicit = table.dataset?.mobileTable || table.closest?.('[data-mobile-table]')?.dataset?.mobileTable;
            if (['list', 'summary', 'matrix'].includes(explicit)) return explicit;
            const columns = table.querySelectorAll?.('thead th')?.length || table.querySelectorAll?.('tr:first-child > *')?.length || 0;
            const copy = String(table.textContent || '');
            if (columns >= 9) return 'matrix';
            if (/(平均|合计|优秀率|及格率|排名|统计|汇总)/.test(copy) || columns >= 6) return 'summary';
            return 'list';
        },

        handleTableScroll: function (e) {
            const target = e.target;
            if (!target || !target.classList || !target.classList.contains('table-wrap')) {
                return;
            }

            this.updateScrollIndicators(target);
        },

        updateScrollIndicators: function (tableWrap) {
            const table = tableWrap.querySelector('table');
            if (!table) return;

            const scrollLeft = tableWrap.scrollLeft;
            const scrollWidth = tableWrap.scrollWidth;
            const clientWidth = tableWrap.clientWidth;
            const maxScrollLeft = scrollWidth - clientWidth;

            // Show left indicator if scrolled right
            if (scrollLeft > 10) {
                tableWrap.dataset.scrollLeft = 'true';
            } else {
                tableWrap.dataset.scrollLeft = 'false';
            }

            // Show right indicator if not at end
            if (scrollLeft < maxScrollLeft - 10) {
                tableWrap.dataset.scrollRight = 'true';
            } else {
                tableWrap.dataset.scrollRight = 'false';
            }

            // Hide scroll hint after first interaction
            if (scrollLeft > 0 && tableWrap.dataset.scrollHint === 'true') {
                tableWrap.dataset.scrollHint = 'false';
            }
        },

        refreshAllTables: function () {
            const tableWraps = document.querySelectorAll('.table-wrap');
            tableWraps.forEach(tableWrap => {
                this.setupTableWrap(tableWrap);
            });
        },

        setupTableWrap: function (tableWrap) {
            const table = tableWrap.querySelector('table');
            if (!table) return;
            const strategy = this.classifyTable(table);
            tableWrap.dataset.mobileTable = strategy;
            tableWrap.dataset.mobileTableReady = 'true';
            table.dataset.mobileTable = strategy;
            tableWrap.dataset.stickyFirstColumn = strategy === 'matrix' ? 'true' : 'false';

            // Check if table is wider than container
            const needsScroll = tableWrap.scrollWidth > tableWrap.clientWidth;

            if (needsScroll) {
                // Show scroll hint initially
                if (!tableWrap.hasAttribute('data-scroll-hint')) {
                    tableWrap.dataset.scrollHint = 'true';
                }

                // Set initial indicators
                tableWrap.dataset.scrollLeft = 'false';
                tableWrap.dataset.scrollRight = 'true';

                // Auto-hide hint after 3 seconds
                setTimeout(() => {
                    if (tableWrap.dataset.scrollHint === 'true') {
                        tableWrap.dataset.scrollHint = 'false';
                    }
                }, 3000);
            } else {
                tableWrap.dataset.scrollHint = 'false';
                tableWrap.dataset.scrollLeft = 'false';
                tableWrap.dataset.scrollRight = 'false';
            }
            return tableWrap;
        },

        observeTableChanges: function () {
            const observer = new MutationObserver((mutations) => {
                let shouldRefresh = false;

                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.matches('.table-wrap') || node.querySelector('.table-wrap')) {
                                shouldRefresh = true;
                            }
                        }
                    });
                });

                if (shouldRefresh) {
                    setTimeout(() => this.refreshAllTables(), 100);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TableScrollIndicators.init());
    } else {
        TableScrollIndicators.init();
    }

    // Expose to global scope
    root.TableScrollIndicators = TableScrollIndicators;

    console.info('[TableScrollIndicators] Module loaded');

})(window);
