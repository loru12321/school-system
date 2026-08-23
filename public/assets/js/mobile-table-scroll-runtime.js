/**
 * Mobile Table Scroll Indicators
 * Adds visual indicators for horizontally scrollable tables
 */

(function (root) {
    'use strict';

    const TableScrollIndicators = {
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
            document.addEventListener('scroll', this.handleTableScroll.bind(this), { passive: true, capture: true });
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

            // Make table-wrap scrollable
            tableWrap.style.overflowX = 'auto';
            tableWrap.style.overflowY = 'visible';
            tableWrap.style.webkitOverflowScrolling = 'touch';

            // Check if table is wider than container
            const needsScroll = table.scrollWidth > tableWrap.clientWidth;

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
