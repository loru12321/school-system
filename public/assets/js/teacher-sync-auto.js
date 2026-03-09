(function (global) {
    "use strict";

    function getDb() {
        if (typeof global.CohortDB !== "undefined" && global.CohortDB && typeof global.CohortDB.ensure === "function") {
            return global.CohortDB.ensure();
        }
        return null;
    }

    function parseTeacherTermApproxMs(termId) {
        if (!termId) return 0;
        var m = String(termId).match(/(\d{4})-(\d{4})_(.+?)(?:_|$)/);
        if (!m) return 0;
        var startYear = Number(m[1]);
        var term = m[3];
        if (!Number.isFinite(startYear)) return 0;
        var month = /上/.test(term) ? 2 : 9;
        return new Date(startYear, month - 1, 1).getTime();
    }

    function pickAutoTeacherTerm() {
        var db = getDb();
        var history = (db && db.teachingHistory) || {};
        var now = Date.now();
        var entries = Object.entries(history)
            .map(function (kv) {
                var termId = kv[0];
                var entry = kv[1];
                var mapObj = entry && entry.map && typeof entry.map === "object" ? entry.map : (entry || {});
                var size = mapObj && typeof mapObj === "object" ? Object.keys(mapObj).length : 0;
                var rawTs = entry && (entry.savedAt || entry.updated_at || entry.updatedAt || entry.importedAt || entry.createdAt);
                var parsedTs = typeof rawTs === "number" ? rawTs : Date.parse(String(rawTs || ""));
                var ts = Number.isFinite(parsedTs) ? parsedTs : 0;
                var approxTs = parseTeacherTermApproxMs(termId);
                return { termId: termId, size: size, ts: ts, approxTs: approxTs };
            })
            .filter(function (x) { return x.termId && x.size > 0; });

        if (!entries.length) {
            return localStorage.getItem("CURRENT_TERM_ID") || "";
        }

        entries.sort(function (a, b) {
            if (a.ts && b.ts) return Math.abs(a.ts - now) - Math.abs(b.ts - now);
            if (a.ts || b.ts) return b.ts - a.ts;
            return Math.abs(a.approxTs - now) - Math.abs(b.approxTs - now);
        });
        return entries[0].termId;
    }

    function applyTeacherTermWithoutPrompt(termId) {
        if (!termId) return false;

        localStorage.setItem("CURRENT_TERM_ID", termId);
        var termSel = document.getElementById("dm-teacher-term-select");
        if (termSel) {
            var hit = Array.from(termSel.options || []).find(function (o) {
                return o.value === termId || String(o.value).startsWith(termId + "_");
            });
            termSel.value = hit ? hit.value : termId;
        }

        var db = getDb();
        var history = (db && db.teachingHistory) || {};
        var entry = history[termId];
        var localMap = entry && entry.map && typeof entry.map === "object" ? entry.map : (entry || {});
        var localSchoolMap = entry && entry.schoolMap && typeof entry.schoolMap === "object" ? entry.schoolMap : {};

        if (localMap && Object.keys(localMap).length > 0) {
            if (typeof global.setTeacherMap === "function") {
                global.setTeacherMap(JSON.parse(JSON.stringify(localMap)));
            }
            if (typeof global.setTeacherSchoolMap === "function") {
                global.setTeacherSchoolMap(JSON.parse(JSON.stringify(localSchoolMap)));
            }
            if (global.DataManager && typeof global.DataManager.renderTeachers === "function") {
                global.DataManager.renderTeachers();
            }
            if (global.DataManager && typeof global.DataManager.refreshTeacherAnalysis === "function") {
                global.DataManager.refreshTeacherAnalysis();
            }
            return true;
        }

        if (global.CloudManager && typeof global.CloudManager.loadTeachers === "function") {
            global.CloudManager.loadTeachers();
            return true;
        }
        return false;
    }

    function promptTeacherSyncIfNeeded() {
        return applyTeacherTermWithoutPrompt(pickAutoTeacherTerm());
    }

    function scheduleTeacherSyncPrompt() {
        if (global.TEACHER_MAP && Object.keys(global.TEACHER_MAP).length > 0) return;
        var tries = 0;
        var timer = setInterval(function () {
            tries += 1;
            var done = promptTeacherSyncIfNeeded();
            if (done || tries >= 10) {
                clearInterval(timer);
            }
        }, 400);
    }

    global.TeacherSyncAuto = {
        parseTeacherTermApproxMs: parseTeacherTermApproxMs,
        pickAutoTeacherTerm: pickAutoTeacherTerm,
        applyTeacherTermWithoutPrompt: applyTeacherTermWithoutPrompt,
        promptTeacherSyncIfNeeded: promptTeacherSyncIfNeeded,
        scheduleTeacherSyncPrompt: scheduleTeacherSyncPrompt
    };

    if (typeof global.promptTeacherSyncIfNeeded !== "function") {
        global.promptTeacherSyncIfNeeded = promptTeacherSyncIfNeeded;
    }
    if (typeof global.scheduleTeacherSyncPrompt !== "function") {
        global.scheduleTeacherSyncPrompt = scheduleTeacherSyncPrompt;
    }
})(window);
