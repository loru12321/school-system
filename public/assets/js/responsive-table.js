/**
 * 🟢 响应式卡片化表格模块
 * 用途：将复杂的横向滚动表格在移动端转换为卡片布局，提升用户体验
 * 
 * 核心思想：
 * 1. 在 PC 端保持原有的表格布局
 * 2. 在移动端（<768px）自动转换为卡片布局
 * 3. 每行数据变成一个卡片，键值对竖向排列
 */

const ResponsiveTable = {
    /**
     * 将 HTML 表格转换为响应式卡片布局
     * @param {String} tableSelector - 表格选择器
     * @param {Object} options - 配置选项
     */
    convert(tableSelector, options = {}) {
        const defaults = {
            breakpoint: 768,        // 响应式断点（px）
            cardClass: 'responsive-card',
            headerClass: 'card-header',
            rowClass: 'card-row',
            labelClass: 'card-label',
            valueClass: 'card-value'
        };

        const config = { ...defaults, ...options };
        const table = document.querySelector(tableSelector);

        if (!table) {
            console.warn(`⚠️ 表格未找到: ${tableSelector}`);
            return;
        }

        // 获取表头
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());

        // 监听窗口大小变化
        const handleResize = () => {
            if (window.innerWidth < config.breakpoint) {
                this._convertToCards(table, headers, config);
            } else {
                this._convertToTable(table, config);
            }
        };

        // 初始化
        handleResize();

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize);
    },

    /**
     * 转换为卡片布局
     * @private
     */
    _convertToCards(table, headers, config) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // 标记为已转换，避免重复处理
        if (table.dataset.converted === 'cards') return;
        table.dataset.converted = 'cards';

        // 隐藏原表格
        table.style.display = 'none';

        // 创建卡片容器
        let cardsContainer = document.getElementById(`${table.id}-cards`);
        if (!cardsContainer) {
            cardsContainer = document.createElement('div');
            cardsContainer.id = `${table.id}-cards`;
            cardsContainer.className = 'responsive-cards-container';
            table.parentNode.insertBefore(cardsContainer, table);
        }

        cardsContainer.innerHTML = '';

        // 遍历表格行，转换为卡片
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, idx) => {
            const card = document.createElement('div');
            card.className = config.cardClass;

            const cells = row.querySelectorAll('td');
            let cardHTML = '';

            cells.forEach((cell, cellIdx) => {
                const label = headers[cellIdx] || `列 ${cellIdx + 1}`;
                const value = cell.innerHTML;

                cardHTML += `
                    <div class="${config.rowClass}">
                        <span class="${config.labelClass}">${label}</span>
                        <span class="${config.valueClass}">${value}</span>
                    </div>
                `;
            });

            card.innerHTML = cardHTML;
            cardsContainer.appendChild(card);
        });

        // 注入样式
        this._injectCardStyles();
    },

    /**
     * 转换回表格布局
     * @private
     */
    _convertToTable(table, config) {
        // 标记为已转换，避免重复处理
        if (table.dataset.converted === 'table') return;
        table.dataset.converted = 'table';

        // 显示原表格
        table.style.display = 'table';

        // 隐藏卡片容器
        const cardsContainer = document.getElementById(`${table.id}-cards`);
        if (cardsContainer) {
            cardsContainer.style.display = 'none';
        }
    },

    /**
     * 注入卡片样式
     * @private
     */
    _injectCardStyles() {
        // 检查样式是否已注入
        if (document.getElementById('responsive-table-styles')) return;

        const style = document.createElement('style');
        style.id = 'responsive-table-styles';
        style.textContent = `
            .responsive-cards-container {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 10px;
            }

            .responsive-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
            }

            .responsive-card:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(-2px);
            }

            .card-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
            }

            .card-row:last-child {
                border-bottom: none;
            }

            .card-label {
                font-weight: 600;
                color: #475569;
                font-size: 13px;
                flex: 0 0 40%;
            }

            .card-value {
                color: #1e293b;
                font-size: 14px;
                text-align: right;
                flex: 1;
                word-break: break-word;
            }

            /* 数值类型的特殊样式 */
            .card-value.numeric {
                color: #2563eb;
                font-weight: 600;
            }

            /* 状态类型的特殊样式 */
            .card-value.status-good {
                color: #16a34a;
            }

            .card-value.status-warning {
                color: #ea580c;
            }

            .card-value.status-bad {
                color: #dc2626;
            }

            @media (max-width: 480px) {
                .responsive-card {
                    padding: 12px;
                }

                .card-label {
                    font-size: 12px;
                }

                .card-value {
                    font-size: 13px;
                }
            }
        `;

        document.head.appendChild(style);
    },

    /**
     * 为卡片值添加样式类
     * @param {String} tableSelector - 表格选择器
     * @param {Function} classifierFn - 分类函数，返回样式类名
     */
    addValueClassifier(tableSelector, classifierFn) {
        const table = document.querySelector(tableSelector);
        const cardsContainer = document.getElementById(`${table.id}-cards`);

        if (!cardsContainer) return;

        const valueElements = cardsContainer.querySelectorAll('.card-value');
        valueElements.forEach((el, idx) => {
            const className = classifierFn(el.textContent, idx);
            if (className) {
                el.classList.add(className);
            }
        });
    }
};

// 导出到全局作用域
window.ResponsiveTable = ResponsiveTable;

// 自动初始化所有 data-responsive 属性的表格
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table[data-responsive]').forEach(table => {
        const selector = `#${table.id}`;
        ResponsiveTable.convert(selector);
    });
});
