(function (global) {
    if (global.ZhongkaoCountdownModule) return;

    const STORAGE_KEY = 'SYSTEM_ZHONGKAO_COUNTDOWN_CONFIG_V1';
    const CONFIG_VERSION = 1;
    const DAY_MS = 24 * 60 * 60 * 1000;

    const state = {
        config: null,
        root: null,
        el: {},
        autoSaveTimer: null,
        clockTimer: null,
        noticeTimer: null,
        mounted: false
    };

    function getDefaultConfig() {
        return {
            version: CONFIG_VERSION,
            examDate: '2026-06-13',
            excludeWeekends: true,
            holidays: [],
            officialHolidays: {},
            lastSyncedAt: ''
        };
    }

    function createHoliday(name = '', start = '', end = '') {
        return {
            id: typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `zkc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            start,
            end
        };
    }

    function normalizeDateString(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : '';
    }

    function parseLocalDate(dateString) {
        const normalized = normalizeDateString(dateString);
        if (!normalized) return null;
        const [year, month, day] = normalized.split('-').map(Number);
        const next = new Date(year, month - 1, day);
        next.setHours(0, 0, 0, 0);
        if (next.getFullYear() !== year || next.getMonth() !== month - 1 || next.getDate() !== day) {
            return null;
        }
        return next;
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function formatDateCn(dateString) {
        const date = parseLocalDate(dateString);
        return date ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : dateString;
    }

    function addDays(date, days) {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }

    function normalizeHolidayItem(item) {
        if (!item || typeof item !== 'object') return null;
        const holiday = createHoliday(
            typeof item.name === 'string' ? item.name.trim() : '',
            normalizeDateString(item.start),
            normalizeDateString(item.end)
        );
        if (typeof item.id === 'string' && item.id.trim()) holiday.id = item.id.trim();
        return holiday;
    }

    function normalizeOfficialHolidayMap(raw) {
        if (!raw || typeof raw !== 'object') return {};
        const output = {};
        Object.entries(raw).forEach(([dateKey, info]) => {
            const date = normalizeDateString(dateKey);
            if (!date || !info || typeof info !== 'object') return;
            output[date] = {
                isHoliday: Boolean(info.isHoliday),
                name: typeof info.name === 'string' && info.name.trim()
                    ? info.name.trim()
                    : (Boolean(info.isHoliday) ? '法定节假日' : '调休上课')
            };
        });
        return output;
    }

    function normalizeConfig(raw) {
        const next = getDefaultConfig();
        if (!raw || typeof raw !== 'object') return next;
        next.examDate = normalizeDateString(raw.examDate) || next.examDate;
        next.excludeWeekends = raw.excludeWeekends !== false;
        next.holidays = Array.isArray(raw.holidays) ? raw.holidays.map(normalizeHolidayItem).filter(Boolean) : [];
        next.officialHolidays = normalizeOfficialHolidayMap(raw.officialHolidays);
        next.lastSyncedAt = typeof raw.lastSyncedAt === 'string' ? raw.lastSyncedAt : '';
        return next;
    }

    function ensureStyles() {
        if (document.getElementById('zkc-runtime-style')) return;
        const style = document.createElement('style');
        style.id = 'zkc-runtime-style';
        style.textContent = `
            .zkc-shell{display:grid;gap:18px}
            .zkc-toolbar,.zkc-card,.zkc-stat{background:rgba(255,255,255,.9);border:1px solid rgba(148,163,184,.16);border-radius:24px;box-shadow:0 18px 44px rgba(15,23,42,.06)}
            .zkc-toolbar{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:24px;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(31,41,55,.92) 45%,rgba(244,114,182,.84))}
            .zkc-toolbar-copy{display:grid;gap:10px;color:#fff;max-width:620px}
            .zkc-kicker{display:inline-flex;align-items:center;gap:8px;width:max-content;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:700;letter-spacing:.04em}
            .zkc-toolbar h3{margin:0;font-size:30px;line-height:1.1;color:#fff}
            .zkc-toolbar p{margin:0;color:rgba(255,255,255,.84);line-height:1.7}
            .zkc-toolbar-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;align-items:center}
            .zkc-clock{display:inline-flex;align-items:center;justify-content:center;min-width:124px;padding:11px 14px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.18);font-size:15px;font-weight:700;color:#fff;font-family:"SFMono-Regular","Consolas","Menlo",monospace}
            .zkc-toolbar-actions .btn{min-height:42px}
            .zkc-notice{padding:14px 16px;border-radius:18px;font-size:14px;line-height:1.6}
            .zkc-notice.is-hidden{display:none}
            .zkc-notice.info{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
            .zkc-notice.success{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
            .zkc-notice.error{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}
            .zkc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
            .zkc-stat{padding:20px}
            .zkc-stat-label{font-size:13px;font-weight:700;color:#64748b}
            .zkc-stat-value{margin-top:10px;font-size:42px;line-height:1;font-weight:800;color:#0f172a}
            .zkc-stat-tip{margin-top:8px;font-size:13px;line-height:1.7;color:#64748b}
            .zkc-grid{display:grid;grid-template-columns:1.04fr .96fr;gap:18px}
            .zkc-card{padding:22px}
            .zkc-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px}
            .zkc-card-head h4{margin:0;font-size:20px;color:#0f172a}
            .zkc-card-head p{margin:6px 0 0;color:#64748b;line-height:1.7}
            .zkc-pill{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:12px;font-weight:700}
            .zkc-pill.ok{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
            .zkc-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
            .zkc-field{display:grid;gap:8px}
            .zkc-field label{font-size:13px;font-weight:700;color:#334155}
            .zkc-field input[type="date"],.zkc-field input[type="text"]{width:100%;min-height:44px;padding:12px 14px;border-radius:14px;border:1px solid #dbe3ef;background:#fff;color:#0f172a;font:inherit}
            .zkc-help{font-size:12px;line-height:1.7;color:#64748b}
            .zkc-check{display:grid;gap:10px;padding:14px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0}
            .zkc-check label{display:flex;gap:10px;align-items:flex-start;font-weight:700;color:#334155}
            .zkc-check input{margin-top:3px}
            .zkc-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
            .zkc-holidays{display:grid;gap:12px}
            .zkc-empty{padding:16px;border-radius:18px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;line-height:1.7}
            .zkc-holiday-row{display:grid;grid-template-columns:minmax(0,1.2fr) repeat(2,minmax(0,1fr)) auto;gap:10px;align-items:center;padding:14px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0}
            .zkc-holiday-row .btn{min-height:44px}
            .zkc-summary{font-size:16px;line-height:1.9;color:#0f172a}
            .zkc-meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
            .zkc-chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:700}
            .zkc-footer{margin-top:18px;font-size:13px;line-height:1.8;color:#64748b}
            @media (max-width: 1100px){.zkc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zkc-grid{grid-template-columns:1fr}}
            @media (max-width: 760px){.zkc-toolbar{padding:20px}.zkc-toolbar h3{font-size:24px}.zkc-toolbar-actions{justify-content:flex-start}.zkc-stats{grid-template-columns:1fr}.zkc-form-grid{grid-template-columns:1fr}.zkc-holiday-row{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function buildMarkup() {
        return `
            <div class="zkc-shell">
                <div class="zkc-toolbar">
                    <div class="zkc-toolbar-copy">
                        <span class="zkc-kicker"><i class="ti ti-calendar-event"></i> 中考冲刺工具</span>
                        <h3>中考倒计时</h3>
                        <p>默认按 2026-06-13 计算，支持普通周末扣减、法定节假日同步、自定义长假，以及通过文件保存和恢复设置。</p>
                    </div>
                    <div class="zkc-toolbar-actions">
                        <div class="zkc-clock" data-zk="liveClock">--:--:--</div>
                        <button type="button" class="btn btn-gray" data-zk-action="export">保存到文件</button>
                        <button type="button" class="btn btn-gray" data-zk-action="import">从文件恢复</button>
                        <button type="button" class="btn btn-orange" data-zk-action="sync">同步节假日</button>
                        <input type="file" hidden accept=".json,application/json" data-zk="fileInput">
                    </div>
                </div>

                <div class="zkc-notice is-hidden info" data-zk="noticeBar" role="status" aria-live="polite"></div>

                <div class="zkc-stats">
                    <div class="zkc-stat"><div class="zkc-stat-label">自然日倒计时</div><div class="zkc-stat-value" data-zk="totalDays">--</div><div class="zkc-stat-tip">从明天开始，统计到考试当天。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">预计有效学习日</div><div class="zkc-stat-value" data-zk="studyDays">--</div><div class="zkc-stat-tip">已按假期、法定节假日和普通周末扣减。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">普通周末休息</div><div class="zkc-stat-value" data-zk="weekendDays">--</div><div class="zkc-stat-tip">不会与调休上课或自定义假期重复扣减。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">假期休息</div><div class="zkc-stat-value" data-zk="holidayDays">--</div><div class="zkc-stat-tip">包含自定义长假与法定节假日。</div></div>
                </div>

                <div class="zkc-grid">
                    <div class="zkc-card">
                        <div class="zkc-card-head">
                            <div>
                                <h4>基础设置</h4>
                                <p>系统按“自定义假期 &gt; 法定节假日/调休 &gt; 普通周末”的优先级计算。</p>
                            </div>
                            <span class="zkc-pill" data-zk="cacheStatus">尚未同步法定节假日</span>
                        </div>
                        <div class="zkc-form-grid">
                            <div class="zkc-field">
                                <label for="zkcExamDate">中考日期</label>
                                <input id="zkcExamDate" type="date" data-zk="examDate">
                                <div class="zkc-help">默认：2026-06-13。日期按本地时区解析，避免偏移一天。</div>
                            </div>
                            <div class="zkc-check">
                                <label for="zkcExcludeWeekends">
                                    <input id="zkcExcludeWeekends" type="checkbox" checked data-zk="excludeWeekends">
                                    <span>将普通周末计为休息日</span>
                                </label>
                                <div class="zkc-help">若学校存在常态化周末上课，可以关闭这一项。</div>
                            </div>
                        </div>
                        <div class="zkc-actions">
                            <button type="button" class="btn btn-primary" data-zk-action="save">保存并重新计算</button>
                            <button type="button" class="btn btn-gray" data-zk-action="reset">恢复默认设置</button>
                        </div>
                    </div>

                    <div class="zkc-card">
                        <div class="zkc-card-head">
                            <div>
                                <h4>自定义长假</h4>
                                <p>适合填写寒假、暑假、校庆放假或本地统一放假区间。</p>
                            </div>
                            <button type="button" class="btn btn-gray" data-zk-action="addHoliday">添加假期</button>
                        </div>
                        <div class="zkc-holidays" data-zk="holidayList"></div>
                    </div>
                </div>

                <div class="zkc-card">
                    <div class="zkc-card-head">
                        <div>
                            <h4>计算摘要</h4>
                            <p>输入会实时预览，保存后会持久写入当前浏览器本地。适合快速看剩余时间和复习节奏。</p>
                        </div>
                    </div>
                    <div class="zkc-summary" data-zk="summaryText">默认按 2026-06-13 计算，可自行修改日期。</div>
                    <div class="zkc-meta" data-zk="summaryMeta"></div>
                    <div class="zkc-footer"><strong>说明：</strong>如果存在调休上课日，系统会优先把它视为上课日，不会再被周末规则扣除；从文件恢复时也会自动兼容旧字段。</div>
                </div>
            </div>
        `;
    }

    function cacheElements() {
        state.el = {
            noticeBar: state.root.querySelector('[data-zk="noticeBar"]'),
            totalDays: state.root.querySelector('[data-zk="totalDays"]'),
            studyDays: state.root.querySelector('[data-zk="studyDays"]'),
            weekendDays: state.root.querySelector('[data-zk="weekendDays"]'),
            holidayDays: state.root.querySelector('[data-zk="holidayDays"]'),
            examDate: state.root.querySelector('[data-zk="examDate"]'),
            excludeWeekends: state.root.querySelector('[data-zk="excludeWeekends"]'),
            cacheStatus: state.root.querySelector('[data-zk="cacheStatus"]'),
            holidayList: state.root.querySelector('[data-zk="holidayList"]'),
            summaryText: state.root.querySelector('[data-zk="summaryText"]'),
            summaryMeta: state.root.querySelector('[data-zk="summaryMeta"]'),
            liveClock: state.root.querySelector('[data-zk="liveClock"]'),
            fileInput: state.root.querySelector('[data-zk="fileInput"]'),
            saveBtn: state.root.querySelector('[data-zk-action="save"]'),
            resetBtn: state.root.querySelector('[data-zk-action="reset"]'),
            syncBtn: state.root.querySelector('[data-zk-action="sync"]'),
            exportBtn: state.root.querySelector('[data-zk-action="export"]'),
            importBtn: state.root.querySelector('[data-zk-action="import"]'),
            addHolidayBtn: state.root.querySelector('[data-zk-action="addHoliday"]')
        };
    }

    function loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            state.config = getDefaultConfig();
            return;
        }
        try {
            state.config = normalizeConfig(JSON.parse(saved));
        } catch (error) {
            console.error('[zhongkao-countdown] config read failed:', error);
            state.config = getDefaultConfig();
            persistCurrentConfig();
            showNotice('本地倒计时配置读取失败，已恢复默认设置。', 'error', 4200);
        }
    }

    function persistCurrentConfig() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    }

    function collectFormState() {
        const holidays = Array.from(state.el.holidayList.querySelectorAll('.zkc-holiday-row')).map((row) => ({
            id: row.dataset.id || createHoliday().id,
            name: row.querySelector('.zkc-holiday-name')?.value.trim() || '',
            start: normalizeDateString(row.querySelector('.zkc-holiday-start')?.value || ''),
            end: normalizeDateString(row.querySelector('.zkc-holiday-end')?.value || '')
        }));
        return {
            examDate: normalizeDateString(state.el.examDate.value),
            excludeWeekends: state.el.excludeWeekends.checked,
            holidays
        };
    }

    function renderHolidayList(holidays) {
        state.el.holidayList.replaceChildren();
        if (!holidays.length) {
            const empty = document.createElement('div');
            empty.className = 'zkc-empty';
            empty.textContent = '当前还没有自定义假期，点击“添加假期”即可新增区间。';
            state.el.holidayList.appendChild(empty);
            return;
        }

        holidays.forEach((holiday) => {
            const row = document.createElement('div');
            row.className = 'zkc-holiday-row';
            row.dataset.id = holiday.id;

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'zkc-holiday-name';
            nameInput.placeholder = '假期名称，例如：寒假';
            nameInput.value = holiday.name;
            nameInput.addEventListener('input', handleFormChange);

            const startInput = document.createElement('input');
            startInput.type = 'date';
            startInput.className = 'zkc-holiday-start';
            startInput.value = holiday.start;
            startInput.addEventListener('change', handleFormChange);

            const endInput = document.createElement('input');
            endInput.type = 'date';
            endInput.className = 'zkc-holiday-end';
            endInput.value = holiday.end;
            endInput.addEventListener('change', handleFormChange);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'btn btn-gray';
            removeButton.textContent = '删除';
            removeButton.addEventListener('click', () => {
                row.remove();
                persistAndCalculate(false);
            });

            row.append(nameInput, startInput, endInput, removeButton);
            state.el.holidayList.appendChild(row);
        });
    }

    function renderForm() {
        state.el.examDate.value = state.config.examDate || '';
        state.el.excludeWeekends.checked = state.config.excludeWeekends;
        renderHolidayList(state.config.holidays);
        renderCacheStatus();
    }

    function renderCacheStatus() {
        const count = Object.keys(state.config.officialHolidays).length;
        if (!count) {
            state.el.cacheStatus.className = 'zkc-pill';
            state.el.cacheStatus.textContent = '尚未同步法定节假日';
            return;
        }
        const suffix = state.config.lastSyncedAt
            ? ` · ${new Date(state.config.lastSyncedAt).toLocaleString('zh-CN', { hour12: false })}`
            : '';
        state.el.cacheStatus.className = 'zkc-pill ok';
        state.el.cacheStatus.textContent = `已缓存 ${count} 天法定数据${suffix}`;
    }

    function updateStats(metrics) {
        if (!metrics) {
            state.el.totalDays.textContent = '--';
            state.el.studyDays.textContent = '--';
            state.el.weekendDays.textContent = '--';
            state.el.holidayDays.textContent = '--';
            return;
        }
        state.el.totalDays.textContent = String(metrics.totalDays);
        state.el.studyDays.textContent = String(metrics.studyDays);
        state.el.weekendDays.textContent = String(metrics.weekendDays);
        state.el.holidayDays.textContent = String(metrics.holidayDays);
    }

    function renderSummary(text, items) {
        state.el.summaryText.textContent = text;
        state.el.summaryMeta.replaceChildren();
        items.forEach((item) => {
            const chip = document.createElement('span');
            chip.className = 'zkc-chip';
            chip.textContent = item;
            state.el.summaryMeta.appendChild(chip);
        });
    }

    function showNotice(message, type = 'info', autoHideMs = 0) {
        window.clearTimeout(state.noticeTimer);
        state.el.noticeBar.className = `zkc-notice ${type}`;
        state.el.noticeBar.textContent = message;
        if (autoHideMs > 0) {
            state.noticeTimer = window.setTimeout(() => {
                if (state.el.noticeBar.textContent === message) {
                    state.el.noticeBar.className = 'zkc-notice is-hidden info';
                    state.el.noticeBar.textContent = '';
                }
            }, autoHideMs);
        }
    }

    function renderLiveClock() {
        if (!state.el.liveClock) return;
        state.el.liveClock.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    }

    function startLiveClock() {
        renderLiveClock();
        if (state.clockTimer) window.clearInterval(state.clockTimer);
        state.clockTimer = window.setInterval(renderLiveClock, 1000);
    }

    function getValidHolidayRanges(rawHolidays) {
        const ranges = rawHolidays.map((holiday) => {
            const start = parseLocalDate(holiday.start);
            const end = parseLocalDate(holiday.end);
            if (!start || !end) return null;
            return {
                start: Math.min(start.getTime(), end.getTime()),
                end: Math.max(start.getTime(), end.getTime())
            };
        }).filter(Boolean).sort((a, b) => a.start - b.start);

        if (!ranges.length) return [];
        const merged = [ranges[0]];
        for (let i = 1; i < ranges.length; i += 1) {
            const current = ranges[i];
            const prev = merged[merged.length - 1];
            if (current.start <= prev.end + DAY_MS) prev.end = Math.max(prev.end, current.end);
            else merged.push(current);
        }
        return merged;
    }

    function isInRanges(time, ranges) {
        return ranges.some((range) => time >= range.start && time <= range.end);
    }

    function calculate() {
        const form = collectFormState();
        const examDate = parseLocalDate(form.examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!examDate) {
            updateStats(null);
            renderSummary('请选择中考日期后开始计算。系统会从明天开始统计，一直算到考试当天。', [
                '支持本地保存',
                '支持保存到文件和从文件恢复',
                '支持联网同步法定节假日'
            ]);
            return;
        }

        if (examDate <= today) {
            updateStats({ totalDays: 0, studyDays: 0, weekendDays: 0, holidayDays: 0 });
            renderSummary(`考试日期 ${formatDateCn(form.examDate)} 已到达或已过去，当前倒计时已归零。`, [
                '如需继续使用，请修改为新的考试日期'
            ]);
            return;
        }

        const ranges = getValidHolidayRanges(form.holidays);
        const totalDays = Math.round((examDate.getTime() - today.getTime()) / DAY_MS);
        let studyDays = 0;
        let weekendDays = 0;
        let holidayDays = 0;
        let adjustedWorkdays = 0;
        const cursor = new Date(today);
        cursor.setDate(cursor.getDate() + 1);

        while (cursor <= examDate) {
            const now = cursor.getTime();
            const dateKey = formatDate(cursor);
            const day = cursor.getDay();
            let handled = false;

            if (isInRanges(now, ranges)) {
                holidayDays += 1;
                handled = true;
            }

            if (!handled && state.config.officialHolidays[dateKey]) {
                if (state.config.officialHolidays[dateKey].isHoliday) holidayDays += 1;
                else {
                    adjustedWorkdays += 1;
                    studyDays += 1;
                }
                handled = true;
            }

            if (!handled && form.excludeWeekends && (day === 0 || day === 6)) {
                weekendDays += 1;
                handled = true;
            }

            if (!handled) studyDays += 1;
            cursor.setDate(cursor.getDate() + 1);
        }

        updateStats({ totalDays, studyDays, weekendDays, holidayDays });
        renderSummary(
            `距离 ${formatDateCn(form.examDate)} 还有 ${totalDays} 天，其中预计可用于高强度复习的时间约为 ${studyDays} 天。`,
            [
                `统计区间：${formatDate(addDays(today, 1))} 至 ${form.examDate}`,
                `普通周末休息：${weekendDays} 天`,
                `假期休息：${holidayDays} 天`,
                `调休上课：${adjustedWorkdays} 天`
            ]
        );
    }

    function persistAndCalculate(showSavedNotice) {
        state.config = normalizeConfig({ ...state.config, ...collectFormState() });
        persistCurrentConfig();
        renderCacheStatus();
        calculate();
        if (showSavedNotice) showNotice('倒计时设置已保存，并重新计算。', 'success', 2800);
    }

    function handleFormChange() {
        window.clearTimeout(state.autoSaveTimer);
        state.autoSaveTimer = window.setTimeout(() => persistAndCalculate(false), 160);
    }

    function addHolidayRow() {
        const current = collectFormState().holidays;
        current.push(createHoliday('', '', ''));
        state.config = normalizeConfig({ ...state.config, holidays: current });
        renderHolidayList(state.config.holidays);
        persistAndCalculate(false);
    }

    function resetAllSettings() {
        if (!window.confirm('恢复默认设置会清空当前考试日期、假期设置和法定节假日缓存，是否继续？')) return;
        state.config = getDefaultConfig();
        persistCurrentConfig();
        renderForm();
        calculate();
        showNotice('已恢复默认倒计时设置。', 'success', 2800);
    }

    function getTargetSyncYears() {
        const years = new Set([new Date().getFullYear()]);
        const examDate = parseLocalDate(state.el.examDate.value);
        years.add(examDate ? examDate.getFullYear() : new Date().getFullYear() + 1);
        return Array.from(years).sort((a, b) => a - b);
    }

    async function fetchHolidayYear(year) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(`https://timor.tech/api/holiday/year/${year}`, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (payload.code !== 0 || !payload.holiday || typeof payload.holiday !== 'object') {
                throw new Error('返回数据格式不符合预期。');
            }
            const output = {};
            Object.entries(payload.holiday).forEach(([dateKey, info]) => {
                const fullDate = normalizeDateString(info.date || `${year}-${dateKey}`);
                if (!fullDate) return;
                output[fullDate] = {
                    isHoliday: Boolean(info.holiday),
                    name: typeof info.name === 'string' && info.name.trim()
                        ? info.name.trim()
                        : (Boolean(info.holiday) ? '法定节假日' : '调休上课')
                };
            });
            return output;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function syncOnlineHolidays() {
        const years = getTargetSyncYears();
        const original = state.el.syncBtn.textContent;
        state.el.syncBtn.disabled = true;
        state.el.syncBtn.textContent = '同步中...';
        showNotice(`正在同步 ${years.join('、')} 年的法定节假日，请稍候。`, 'info');
        try {
            const merged = { ...state.config.officialHolidays };
            for (const year of years) {
                Object.assign(merged, await fetchHolidayYear(year));
            }
            state.config = normalizeConfig({
                ...state.config,
                ...collectFormState(),
                officialHolidays: merged,
                lastSyncedAt: new Date().toISOString()
            });
            persistCurrentConfig();
            renderCacheStatus();
            calculate();
            showNotice(`同步完成，当前已缓存 ${Object.keys(state.config.officialHolidays).length} 天法定节假日数据。`, 'success', 3800);
        } catch (error) {
            console.error('[zhongkao-countdown] holiday sync failed:', error);
            showNotice('同步失败：请检查网络连接或稍后重试。原有缓存已保留。', 'error', 4200);
        } finally {
            state.el.syncBtn.disabled = false;
            state.el.syncBtn.textContent = original;
        }
    }

    function exportData() {
        persistAndCalculate(false);
        global.ConfigTransferRuntime.downloadJson(
            { ...state.config, exportedAt: new Date().toISOString() },
            { fileName: `zhongkao-countdown-settings-${formatDate(new Date())}.json` }
        );
        showNotice('当前倒计时设置已保存到文件。', 'success', 2400);
    }

    async function importData(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
            const nextConfig = await global.ConfigTransferRuntime.readJson(file);
            state.config = normalizeConfig({ ...state.config, ...nextConfig });
            persistCurrentConfig();
            renderForm();
            calculate();
            showNotice('已从文件恢复倒计时设置，并重新计算。', 'success', 3200);
        } catch (error) {
            console.error('[zhongkao-countdown] import failed:', error);
            showNotice('恢复失败：文件内容不是有效的设置 JSON。', 'error', 4200);
        } finally {
            event.target.value = '';
        }
    }

    function bindEvents() {
        state.el.examDate.addEventListener('change', handleFormChange);
        state.el.excludeWeekends.addEventListener('change', handleFormChange);
        state.el.saveBtn.addEventListener('click', () => persistAndCalculate(true));
        state.el.resetBtn.addEventListener('click', resetAllSettings);
        state.el.syncBtn.addEventListener('click', syncOnlineHolidays);
        state.el.exportBtn.addEventListener('click', exportData);
        state.el.importBtn.addEventListener('click', () => state.el.fileInput.click());
        state.el.fileInput.addEventListener('change', importData);
        state.el.addHolidayBtn.addEventListener('click', addHolidayRow);

        window.addEventListener('storage', (event) => {
            if (event.key !== STORAGE_KEY) return;
            loadFromStorage();
            renderForm();
            calculate();
            showNotice('检测到其他页面更新了倒计时配置，当前页面已同步。', 'info', 3200);
        });
    }

    function mount() {
        state.root = document.getElementById('zhongkao-countdown');
        if (!state.root) return;
        ensureStyles();
        state.root.innerHTML = buildMarkup();
        cacheElements();
        loadFromStorage();
        renderForm();
        bindEvents();
        startLiveClock();
        calculate();
        state.mounted = true;
    }

    global.ZhongkaoCountdownModule = {
        ensureInitialized() {
            if (!global.ConfigTransferRuntime) {
                console.warn('[zhongkao-countdown] ConfigTransferRuntime is not ready');
                return;
            }
            if (!state.mounted || !document.getElementById('zhongkao-countdown')?.querySelector('.zkc-shell')) {
                mount();
                return;
            }
            renderLiveClock();
            calculate();
        }
    };
})(window);
