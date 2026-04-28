function getDataCloudRuntime() {
    return window.DataCloudRuntime && typeof window.DataCloudRuntime === 'object' ? window.DataCloudRuntime : null;
}

function requireDataCloudRuntime() {
    const runtime = getDataCloudRuntime();
    if (!runtime) {
        throw new Error('DataCloudRuntime unavailable');
    }
    return runtime;
}

function getIssueManagerRuntime() {
    return window.IssueManagerRuntime && typeof window.IssueManagerRuntime === 'object' ? window.IssueManagerRuntime : null;
}

function requireIssueManagerRuntime() {
    const runtime = getIssueManagerRuntime();
    if (!runtime) {
        throw new Error('IssueManagerRuntime unavailable');
    }
    return runtime;
}

function getPackagerRuntime() {
    return window.PackagerRuntime && typeof window.PackagerRuntime === 'object' ? window.PackagerRuntime : null;
}

function requirePackagerRuntime() {
    const runtime = getPackagerRuntime();
    if (!runtime) {
        throw new Error('PackagerRuntime unavailable');
    }
    return runtime;
}

async function ensurePackagerRuntime() {
    const runtime = getPackagerRuntime();
    if (runtime) return runtime;
    if (typeof window.ensurePackagerRuntimeLoaded === 'function') {
        await window.ensurePackagerRuntimeLoaded();
        const loaded = getPackagerRuntime();
        if (loaded) return loaded;
    }
    throw new Error('PackagerRuntime unavailable');
}

function getHelpSystemRuntime() {
    return window.HelpSystemRuntime && typeof window.HelpSystemRuntime === 'object' ? window.HelpSystemRuntime : null;
}

function requireHelpSystemRuntime() {
    const runtime = getHelpSystemRuntime();
    if (!runtime) {
        throw new Error('HelpSystemRuntime unavailable');
    }
    return runtime;
}

function getLoggerRuntime() {
    return window.LoggerRuntime && typeof window.LoggerRuntime === 'object' ? window.LoggerRuntime : null;
}

function requireLoggerRuntime() {
    const runtime = getLoggerRuntime();
    if (!runtime) {
        throw new Error('LoggerRuntime unavailable');
    }
    return runtime;
}

function getWorkerApiRuntime() {
    return window.WorkerApiRuntime && typeof window.WorkerApiRuntime === 'object' ? window.WorkerApiRuntime : null;
}

function requireWorkerApiRuntime() {
    const runtime = getWorkerApiRuntime();
    if (!runtime) {
        throw new Error('WorkerApiRuntime unavailable');
    }
    return runtime;
}

async function ensureWorkerApiRuntime() {
    const runtime = getWorkerApiRuntime();
    if (runtime) return runtime;
    if (typeof window.ensureWorkerApiRuntimeLoaded === 'function') {
        await window.ensureWorkerApiRuntimeLoaded();
        const loaded = getWorkerApiRuntime();
        if (loaded) return loaded;
    }
    throw new Error('WorkerApiRuntime unavailable');
}

function getAccountManagerRuntime() {
    return window.AccountManagerRuntime && typeof window.AccountManagerRuntime === 'object' ? window.AccountManagerRuntime : null;
}

function requireAccountManagerRuntime() {
    const runtime = getAccountManagerRuntime();
    if (!runtime) {
        throw new Error('AccountManagerRuntime unavailable');
    }
    return runtime;
}

function getDataManagerTeacherRuntime() {
    return window.DataManagerTeacherRuntime && typeof window.DataManagerTeacherRuntime === 'object' ? window.DataManagerTeacherRuntime : null;
}

function requireDataManagerTeacherRuntime() {
    const runtime = getDataManagerTeacherRuntime();
    if (!runtime) {
        throw new Error('DataManagerTeacherRuntime unavailable');
    }
    return runtime;
}

function getDataManagerStudentRuntime() {
    return window.DataManagerStudentRuntime && typeof window.DataManagerStudentRuntime === 'object' ? window.DataManagerStudentRuntime : null;
}

function requireDataManagerStudentRuntime() {
    const runtime = getDataManagerStudentRuntime();
    if (!runtime) {
        throw new Error('DataManagerStudentRuntime unavailable');
    }
    return runtime;
}

function getDataManagerArchiveRuntime() {
    return window.DataManagerArchiveRuntime && typeof window.DataManagerArchiveRuntime === 'object' ? window.DataManagerArchiveRuntime : null;
}

function requireDataManagerArchiveRuntime() {
    const runtime = getDataManagerArchiveRuntime();
    if (!runtime) {
        throw new Error('DataManagerArchiveRuntime unavailable');
    }
    return runtime;
}

function getDataManagerGrade9TemplateRuntime() {
    return window.DataManagerGrade9TemplateRuntime && typeof window.DataManagerGrade9TemplateRuntime === 'object' ? window.DataManagerGrade9TemplateRuntime : null;
}

function requireDataManagerGrade9TemplateRuntime() {
    const runtime = getDataManagerGrade9TemplateRuntime();
    if (!runtime) {
        throw new Error('DataManagerGrade9TemplateRuntime unavailable');
    }
    return runtime;
}

function getDataManagerParamsRuntime() {
    return window.DataManagerParamsRuntime && typeof window.DataManagerParamsRuntime === 'object' ? window.DataManagerParamsRuntime : null;
}

function requireDataManagerParamsRuntime() {
    const runtime = getDataManagerParamsRuntime();
    if (!runtime) {
        throw new Error('DataManagerParamsRuntime unavailable');
    }
    return runtime;
}

function getDataManagerTargetsRuntime() {
    return window.DataManagerTargetsRuntime && typeof window.DataManagerTargetsRuntime === 'object' ? window.DataManagerTargetsRuntime : null;
}

function requireDataManagerTargetsRuntime() {
    const runtime = getDataManagerTargetsRuntime();
    if (!runtime) {
        throw new Error('DataManagerTargetsRuntime unavailable');
    }
    return runtime;
}

function getDataManagerSchoolAliasRuntime() {
    return window.DataManagerSchoolAliasRuntime && typeof window.DataManagerSchoolAliasRuntime === 'object' ? window.DataManagerSchoolAliasRuntime : null;
}

function requireDataManagerSchoolAliasRuntime() {
    const runtime = getDataManagerSchoolAliasRuntime();
    if (!runtime) {
        throw new Error('DataManagerSchoolAliasRuntime unavailable');
    }
    return runtime;
}

function getDataManagerSaveSyncRuntime() {
    return window.DataManagerSaveSyncRuntime && typeof window.DataManagerSaveSyncRuntime === 'object' ? window.DataManagerSaveSyncRuntime : null;
}

function requireDataManagerSaveSyncRuntime() {
    const runtime = getDataManagerSaveSyncRuntime();
    if (!runtime) {
        throw new Error('DataManagerSaveSyncRuntime unavailable');
    }
    return runtime;
}

function getDataManagerHistoryRuntime() {
    return window.DataManagerHistoryRuntime && typeof window.DataManagerHistoryRuntime === 'object' ? window.DataManagerHistoryRuntime : null;
}

function requireDataManagerHistoryRuntime() {
    const runtime = getDataManagerHistoryRuntime();
    if (!runtime) {
        throw new Error('DataManagerHistoryRuntime unavailable');
    }
    return runtime;
}

function getDataManagerTabRuntime() {
    return window.DataManagerTabRuntime && typeof window.DataManagerTabRuntime === 'object' ? window.DataManagerTabRuntime : null;
}

function requireDataManagerTabRuntime() {
    const runtime = getDataManagerTabRuntime();
    if (!runtime) {
        throw new Error('DataManagerTabRuntime unavailable');
    }
    return runtime;
}

window.setCloudSyncStatus = (state, detail = '') => {
    CloudSyncIndicator.set(state, detail);
};

function isLocalFileRuntimeForApp() {
    return window.__IS_LOCAL_FILE_RUNTIME__ === true
        || (window.location && String(window.location.protocol || '').trim().toLowerCase() === 'file:');
}
