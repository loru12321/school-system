(function installManagementFacades(root) {
    if (!root) return;

    const DATA_PROCESSING_WORKER_SCRIPT = './assets/js/data-processing-worker.js';

    function getDataProcessingWorkerScriptUrl() {
        return typeof root.getVersionedAssetPath === 'function'
            ? root.getVersionedAssetPath(DATA_PROCESSING_WORKER_SCRIPT)
            : DATA_PROCESSING_WORKER_SCRIPT;
    }

    root.IssueManager = root.IssueManager || {
        isHistoryMode: false,
        openSubmitModal: function (name, cls, school) {
            return root.requireIssueManagerRuntime().openSubmitModal(name, cls, school);
        },
        submit: async function () {
            return root.requireIssueManagerRuntime().submit();
        },
        checkIssues: async function () {
            return root.requireIssueManagerRuntime().checkIssues();
        },
        openAdminPanel: async function () {
            return root.requireIssueManagerRuntime().openAdminPanel(this);
        },
        toggleHistoryView: function () {
            return root.requireIssueManagerRuntime().toggleHistoryView(this);
        },
        updateUIState: function () {
            return root.requireIssueManagerRuntime().updateUIState(this);
        },
        toggleSelectAll: function (source) {
            return root.requireIssueManagerRuntime().toggleSelectAll(this, source);
        },
        getCheckedIds: function () {
            return root.requireIssueManagerRuntime().getCheckedIds();
        },
        loadIssues: async function () {
            return root.requireIssueManagerRuntime().loadIssues(this);
        },
        resolve: async function (id) {
            return root.requireIssueManagerRuntime().resolve(this, id);
        },
        batchSoftDelete: async function () {
            return root.requireIssueManagerRuntime().batchSoftDelete(this);
        },
        batchRestore: async function () {
            return root.requireIssueManagerRuntime().batchRestore(this);
        },
        batchHardDelete: async function () {
            return root.requireIssueManagerRuntime().batchHardDelete(this);
        }
    };

    root.Packager = root.Packager || {
        exportDistributableHTML: async function () {
            const runtime = await root.ensurePackagerRuntime();
            return runtime.exportDistributableHTML();
        }
    };

    root.HelpSystem = root.HelpSystem || {
        content: root.requireHelpSystemRuntime().createDefaultContent(),
        show: function (key) {
            return root.requireHelpSystemRuntime().show(this, key);
        },
        startTour: function () {
            return root.requireHelpSystemRuntime().startTour(this);
        },
        checkFirstRun: function () {
            return root.requireHelpSystemRuntime().checkFirstRun(this);
        }
    };

    root.WorkerAPI = root.WorkerAPI || {
        worker: null,
        async init() {
            const runtime = await root.ensureWorkerApiRuntime();
            return runtime.init(this, '', getDataProcessingWorkerScriptUrl());
        },
        async run(data) {
            const runtime = await root.ensureWorkerApiRuntime();
            return runtime.run(this, data, '', getDataProcessingWorkerScriptUrl());
        }
    };

    root.Logger = root.Logger || {
        isHistoryMode: false,
        log: async function (action, details) {
            return root.requireLoggerRuntime().log(action, details);
        },
        view: function () {
            return root.requireLoggerRuntime().view(this);
        },
        toggleHistoryView: function () {
            return root.requireLoggerRuntime().toggleHistoryView(this);
        },
        updateUIState: function () {
            return root.requireLoggerRuntime().updateUIState(this);
        },
        loadLogs: async function () {
            return root.requireLoggerRuntime().loadLogs(this);
        },
        toggleSelectAll: function (source) {
            return root.requireLoggerRuntime().toggleSelectAll(this, source);
        },
        getCheckedIds: function () {
            return root.requireLoggerRuntime().getCheckedIds();
        },
        batchSoftDelete: async function () {
            return root.requireLoggerRuntime().batchSoftDelete(this);
        },
        batchRestore: async function () {
            return root.requireLoggerRuntime().batchRestore(this);
        },
        batchHardDelete: async function () {
            return root.requireLoggerRuntime().batchHardDelete(this);
        }
    };

    root.AccountManager = root.AccountManager || {
        open: function () {
            return root.requireAccountManagerRuntime().open(this);
        },
        search: async function () {
            return root.requireAccountManagerRuntime().search(this);
        },
        renderTable: function (list) {
            return root.requireAccountManagerRuntime().renderTable(list);
        },
        editAttributes: async function (username, currentRole, currentClass, currentSchool) {
            return root.requireAccountManagerRuntime().editAttributes(this, username, currentRole, currentClass, currentSchool);
        },
        saveInlineEdit: async function () {
            return root.requireAccountManagerRuntime().saveInlineEdit(this);
        },
        cancelEdit: function () {
            return root.requireAccountManagerRuntime().cancelEdit();
        },
        resetPassword: async function (username) {
            return root.requireAccountManagerRuntime().resetPassword(this, username);
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
