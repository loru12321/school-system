// Teaching management runtime: core state and schedulers.
var TM_CLOUD_OPS_CACHE = {
    key: '',
    fetchedAt: 0,
    warnings: [],
    tasks: [],
    authState: 'unknown',
    error: ''
};
var TM_CLOUD_OPS_REQUEST_ID = 0;
var TM_CLOUD_OPS_INFLIGHT = null;
var TM_CLOUD_OPS_INFLIGHT_KEY = '';
var TM_VERSION_CACHE = {
    key: '',
    fetchedAt: 0,
    records: [],
    authState: 'unknown',
    error: ''
};
var TM_VERSION_REQUEST_ID = 0;
var TM_VERSION_DIFF_STATE = {
    versionId: '',
    html: '',
    title: ''
};
var TM_OVERVIEW_RENDER_FRAME = 0;
var SM_OVERVIEW_RENDER_FRAME = 0;

function tmScheduleTeachingOverviewRender() {
    if (TM_OVERVIEW_RENDER_FRAME) return;
    const runner = () => {
        TM_OVERVIEW_RENDER_FRAME = 0;
        if (typeof renderTeachingOverview === 'function') renderTeachingOverview();
    };
    if (typeof window.requestAnimationFrame === 'function') {
        TM_OVERVIEW_RENDER_FRAME = window.requestAnimationFrame(runner);
    } else {
        TM_OVERVIEW_RENDER_FRAME = window.setTimeout(runner, 16);
    }
}

function smScheduleStudentOverviewRender() {
    if (SM_OVERVIEW_RENDER_FRAME) return;
    const runner = () => {
        SM_OVERVIEW_RENDER_FRAME = 0;
        const active = document.getElementById('student-overview');
        if (active && active.classList.contains('active') && typeof renderStudentOverview === 'function') {
            renderStudentOverview();
        }
    };
    if (typeof window.requestAnimationFrame === 'function') {
        SM_OVERVIEW_RENDER_FRAME = window.requestAnimationFrame(runner);
    } else {
        SM_OVERVIEW_RENDER_FRAME = window.setTimeout(runner, 16);
    }
}

window.tmScheduleTeachingOverviewRender = tmScheduleTeachingOverviewRender;
window.smScheduleStudentOverviewRender = smScheduleStudentOverviewRender;
