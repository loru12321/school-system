// Alpine.js 数据仓库初始化
function escapeTeacherCardHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function buildTeacherCardList(statsObj, rankingObj, currentUserName = '', currentRole = 'guest') {
    const arr = [];
    if (statsObj && Object.keys(statsObj).length > 0) {
        Object.keys(statsObj).sort().forEach(teacher => {
            Object.keys(statsObj[teacher]).sort((a, b) => a.localeCompare(b)).forEach(subject => {
                const data = statsObj[teacher][subject];
                let badgeClass = 'performance-poor';
                let badgeText = '需改进';
                const avg = parseFloat(data.avg);
                const exc = data.excellentRate * 100;
                const pass = data.passRate * 100;
                if (avg >= 85 && exc >= 30 && pass >= 90) {
                    badgeClass = 'performance-excellent';
                    badgeText = '优秀';
                } else if (avg >= 80 && exc >= 25 && pass >= 85) {
                    badgeClass = 'performance-good';
                    badgeText = '良好';
                } else if (avg >= 75 && exc >= 20 && pass >= 80) {
                    badgeClass = 'performance-average';
                    badgeText = '中等';
                }
                const rank = (rankingObj && rankingObj[teacher] && rankingObj[teacher][subject])
                    ? rankingObj[teacher][subject].rank
                    : '-';
                arr.push({
                    id: `${teacher}-${subject}`,
                    name: teacher,
                    subject,
                    classes: data.classes,
                    avg: data.avg,
                    excRate: (data.excellentRate * 100).toFixed(1) + '%',
                    passRate: (data.passRate * 100).toFixed(1) + '%',
                    count: data.studentCount,
                    rank,
                    badgeClass,
                    badgeText
                });
            });
        });
    }

    const role = String(currentRole || 'guest');
    const normalizedCurrent = String(currentUserName || '').replace(/\s+/g, '').toLowerCase();
    arr.sort((a, b) => {
        if ((role === 'teacher' || role === 'class_teacher') && normalizedCurrent) {
            const aNorm = String(a.name || '').replace(/\s+/g, '').toLowerCase();
            const bNorm = String(b.name || '').replace(/\s+/g, '').toLowerCase();
            const aMe = (aNorm === normalizedCurrent || aNorm.startsWith(normalizedCurrent + '(') || aNorm.startsWith(normalizedCurrent + '（')) ? 1 : 0;
            const bMe = (bNorm === normalizedCurrent || bNorm.startsWith(normalizedCurrent + '(') || bNorm.startsWith(normalizedCurrent + '（')) ? 1 : 0;
            if (aMe !== bMe) return bMe - aMe;
        }

        const avgDiff = (parseFloat(b.avg) || 0) - (parseFloat(a.avg) || 0);
        if (avgDiff !== 0) return avgDiff;

        const passA = parseFloat(String(a.passRate || '').replace('%', '')) || 0;
        const passB = parseFloat(String(b.passRate || '').replace('%', '')) || 0;
        const passDiff = passB - passA;
        if (passDiff !== 0) return passDiff;

        const excA = parseFloat(String(a.excRate || '').replace('%', '')) || 0;
        const excB = parseFloat(String(b.excRate || '').replace('%', '')) || 0;
        const excDiff = excB - excA;
        if (excDiff !== 0) return excDiff;

        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
    });

    return arr;
}

function ensureTeacherDataStore() {
    if (!window.Alpine || typeof Alpine.store !== 'function') return false;
    const existingStore = Alpine.store('teacherData');
    if (existingStore) return true;
    Alpine.store('teacherData', {
        list: [], // 存放扁平化的教师数据

        // 更新数据的逻辑 (供旧代码调用)
        update(statsObj, rankingObj, currentUserName = '', currentRole = 'guest') {
            this.list = buildTeacherCardList(statsObj, rankingObj, currentUserName, currentRole);
        }
    });
    return true;
}

function hydrateTeacherDataStore() {
    if (!window.Alpine || typeof Alpine.store !== 'function') return false;
    const store = Alpine.store('teacherData');
    if (!store) return ensureTeacherDataStore();
    if (!Array.isArray(store.list)) store.list = [];
    if (typeof store.update !== 'function') {
        store.update = function (statsObj, rankingObj, currentUserName = '', currentRole = 'guest') {
            this.list = buildTeacherCardList(statsObj, rankingObj, currentUserName, currentRole);
        };
    }
    return true;
}

document.addEventListener('alpine:init', hydrateTeacherDataStore);
hydrateTeacherDataStore();
