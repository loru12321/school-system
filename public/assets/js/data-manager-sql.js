(() => {
    const DM = typeof DataManager !== 'undefined' ? DataManager : window.DataManager;
    if (!DM || window.__DATA_MANAGER_SQL_PATCHED__) return;

    Object.assign(DM, {
        sqlResultCache: [],
        sqlHistoryKey: 'SQL_HISTORY',
        sqlHistoryLimit: 12,

        getSQLHistory: function () {
            try {
                return JSON.parse(localStorage.getItem(this.sqlHistoryKey) || '[]');
            } catch (e) {
                return [];
            }
        },

        setSQLHistory: function (list) {
            try {
                localStorage.setItem(this.sqlHistoryKey, JSON.stringify(list));
            } catch (e) { }
        },

        addRecentSQL: function (sql) {
            if (!sql) return;
            let list = this.getSQLHistory();
            list = list.filter(item => item.sql !== sql);
            list.unshift({ name: '最近查询', sql, ts: Date.now(), pinned: false });
            if (list.length > this.sqlHistoryLimit) list = list.slice(0, this.sqlHistoryLimit);
            this.setSQLHistory(list);
        },

        renderSQLHistory: function () {
            const sel = document.getElementById('dm-sql-history-select');
            if (!sel) return;
            const list = this.getSQLHistory();
            let options = '<option value="">🕘 最近/收藏</option>';
            list.forEach((item, idx) => {
                const label = item.pinned ? `⭐ ${item.name}` : `🕘 ${item.sql.slice(0, 28)}${item.sql.length > 28 ? '...' : ''}`;
                options += `<option value="${idx}">${label}</option>`;
            });
            sel.innerHTML = options;
        },

        applySQLHistory: function (idx) {
            if (idx === '') return;
            const list = this.getSQLHistory();
            const item = list[Number(idx)];
            if (item && item.sql) {
                document.getElementById('dm-sql-input').value = item.sql;
            }
        },

        saveNamedSQL: function () {
            const sql = document.getElementById('dm-sql-input').value.trim();
            if (!sql) return alert('请先输入 SQL');
            const nameInput = document.getElementById('dm-sql-history-name');
            const name = (nameInput && nameInput.value.trim()) || `收藏 ${new Date().toLocaleString()}`;
            let list = this.getSQLHistory();
            list = list.filter(item => item.sql !== sql);
            list.unshift({ name, sql, ts: Date.now(), pinned: true });
            if (list.length > this.sqlHistoryLimit) list = list.slice(0, this.sqlHistoryLimit);
            this.setSQLHistory(list);
            if (nameInput) nameInput.value = '';
            this.renderSQLHistory();
            if (window.UI) UI.toast('✅ 已保存收藏', 'success');
        },

        clearSQLHistory: function () {
            if (!confirm('确定清空SQL历史吗？')) return;
            localStorage.removeItem(this.sqlHistoryKey);
            this.renderSQLHistory();
        },

        setQuickSQL: function (type) {
            let sql = '';
            switch (type) {
                case 'base':
                    sql = "SELECT school, [class] AS class_name, name, [total] AS total_score FROM students ORDER BY [total] DESC LIMIT 10";
                    break;
                case 'count':
                    sql = "SELECT school, COUNT(1) AS cnt, AVG([total]) AS avg_score FROM students GROUP BY school ORDER BY avg_score DESC";
                    break;
                case 'avg':
                    sql = "SELECT [class] AS class_name, AVG([语文]) AS chinese_avg FROM students GROUP BY [class] ORDER BY chinese_avg DESC";
                    break;
                case 'failed':
                    sql = "SELECT [class] AS class_name, name, [数学] AS math_score FROM students WHERE [数学] < 90 ORDER BY [数学] ASC";
                    break;
                case 'teacher':
                    sql = "SELECT s.[class] AS class_name, s.name, s.[英语] AS english_score, t.teacher FROM students AS s JOIN teachers AS t ON s.[class] = t.class AND t.subject = '英语' WHERE t.teacher LIKE '张%' LIMIT 20";
                    break;
            }
            document.getElementById('dm-sql-input').value = sql;
        },

        prepareSQLData: function () {
            const studentsTable = (window.RAW_DATA || []).map(s => {
                const row = { school: s.school, class: s.class, name: s.name, id: s.id, total: s.total };
                if (s.scores) {
                    Object.keys(s.scores).forEach(sub => {
                        row[sub] = s.scores[sub];
                    });
                }
                return row;
            });

            const teachersTable = [];
            if (window.TEACHER_MAP) {
                Object.keys(window.TEACHER_MAP).forEach(key => {
                    const [cls, sub] = key.split('_');
                    teachersTable.push({ class: cls, subject: sub, teacher: window.TEACHER_MAP[key] });
                });
            }

            return { students: studentsTable, teachers: teachersTable };
        },

        runSQL: function () {
            const sql = document.getElementById('dm-sql-input').value.trim();
            const msgEl = document.getElementById('sql-status-msg');
            const thead = document.querySelector('#dm-sql-table thead');
            const tbody = document.querySelector('#dm-sql-table tbody');

            msgEl.innerText = '';
            thead.innerHTML = '';
            tbody.innerHTML = '';

            if (!sql) return;
            if (typeof alasql === 'undefined') {
                msgEl.innerText = '❌ SQL 引擎未加载，请刷新页面后重试';
                return;
            }

            try {
                const normalizedSql = sql.replace(/COUNT\s*\(\s*\*\s*\)/gi, 'COUNT(1)');
                const db = this.prepareSQLData();

                alasql('CREATE TABLE students');
                alasql('SELECT * INTO students FROM ?', [db.students]);

                alasql('CREATE TABLE teachers');
                alasql('SELECT * INTO teachers FROM ?', [db.teachers]);

                const res = alasql(normalizedSql);
                this.sqlResultCache = res;

                if (!res || res.length === 0) {
                    tbody.innerHTML = '<tr><td style="padding:20px; text-align:center; color:#666;">查询结果为空</td></tr>';
                    return;
                }

                const columns = Object.keys(res[0]);
                thead.innerHTML = `<tr>${columns.map(col => `<th style="background:#f1f5f9; padding:8px;">${col}</th>`).join('')}</tr>`;

                let bodyHtml = '';
                res.slice(0, 500).forEach(row => {
                    bodyHtml += '<tr>';
                    columns.forEach(col => {
                        let val = row[col];
                        if (typeof val === 'number' && val % 1 !== 0) val = val.toFixed(2);
                        bodyHtml += `<td>${val}</td>`;
                    });
                    bodyHtml += '</tr>';
                });

                if (res.length > 500) {
                    bodyHtml += `<tr><td colspan="${columns.length}" style="text-align:center; color:#999;">(结果过多，仅显示前 500 条，请导出 Excel 查看全部)</td></tr>`;
                }

                tbody.innerHTML = bodyHtml;
                this.addRecentSQL(normalizedSql);
                this.renderSQLHistory();

                alasql('DROP TABLE students');
                alasql('DROP TABLE teachers');
            } catch (e) {
                console.error(e);
                msgEl.innerText = '❌ SQL 错误: ' + e.message;
                try {
                    alasql('DROP TABLE IF EXISTS students');
                    alasql('DROP TABLE IF EXISTS teachers');
                } catch (ex) { }
            }
        },

        exportSQLResult: function () {
            if (!this.sqlResultCache || this.sqlResultCache.length === 0) return alert('当前没有查询结果可导出');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(this.sqlResultCache);
            XLSX.utils.book_append_sheet(wb, ws, 'SQL查询结果');
            XLSX.writeFile(wb, '自定义查询结果.xlsx');
        }
    });

    async function talkToData() {
        const inputEl = document.getElementById('dm-nlq-input');
        const statusEl = document.getElementById('dm-nlq-status');
        if (!inputEl || !statusEl) return;
        const question = inputEl.value.trim();
        if (!question) return alert('请输入查询需求');
        statusEl.innerText = 'AI 解析中...';

        try {
            const schema = buildNLQSchema();
            const prompt = buildNLQPrompt(question, schema);
            const aiText = await callUnifiedAI(prompt);
            const sql = extractSQLFromAI(aiText);

            if (!isSafeSQL(sql)) {
                statusEl.innerText = '⚠️ 生成SQL不安全或不完整，请修改后再执行';
                return;
            }

            document.getElementById('dm-sql-input').value = sql;
            DM.runSQL();
            statusEl.innerText = '✅ 已生成SQL并执行';
        } catch (e) {
            console.error(e);
            statusEl.innerText = '❌ 解析失败，请重试';
            if (window.UI) UI.toast('AI 解析失败，请重试', 'error');
        }
    }

    function buildNLQSchema() {
        const db = DM.prepareSQLData();
        const studentsCols = db.students && db.students.length ? Object.keys(db.students[0]) : [];
        const teachersCols = db.teachers && db.teachers.length ? Object.keys(db.teachers[0]) : ['class', 'subject', 'teacher'];
        return {
            tables: {
                students: studentsCols,
                teachers: teachersCols
            },
            notes: 'students含成绩字段，teachers为任课表，可JOIN students.class=teachers.class'
        };
    }

    function buildNLQPrompt(question, schema) {
        return `你是校务数据分析师。请把用户的自然语言查询转换为可执行的 AlaSQL SELECT 语句。
要求：
1) 只允许 SELECT 查询；不要使用 INSERT/UPDATE/DELETE/CREATE/DROP。
2) 表只有 students 和 teachers。
3) 优先输出明确字段，不要 SELECT *。
4) 输出仅包含 SQL，不要解释，不要 Markdown。

【表结构】\n${JSON.stringify(schema)}\n
【用户问题】\n${question}\n`;
    }

    function extractSQLFromAI(text) {
        if (!text) return '';
        let sql = text.trim();
        const codeMatch = sql.match(/```(?:sql)?\s*([\s\S]*?)```/i);
        if (codeMatch) sql = codeMatch[1].trim();
        const selectIdx = sql.toUpperCase().indexOf('SELECT');
        if (selectIdx > 0) sql = sql.slice(selectIdx);
        sql = sql.replace(/;\s*$/g, '').trim();
        return sql;
    }

    function isSafeSQL(sql) {
        if (!sql) return false;
        const s = sql.trim();
        if (!/^select\b/i.test(s)) return false;
        if (/(update|delete|insert|drop|alter|truncate|create|replace|merge|grant|revoke)\b/i.test(s)) return false;
        return true;
    }

    window.talkToData = talkToData;
    window.buildNLQSchema = buildNLQSchema;
    window.buildNLQPrompt = buildNLQPrompt;
    window.extractSQLFromAI = extractSQLFromAI;
    window.isSafeSQL = isSafeSQL;
    window.__DATA_MANAGER_SQL_PATCHED__ = true;
})();
