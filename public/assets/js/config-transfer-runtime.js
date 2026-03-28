(function (global) {
    if (global.ConfigTransferRuntime) return;

    async function readText(file) {
        if (!file) {
            throw new Error('未选择文件');
        }
        if (typeof file.text === 'function') {
            return await file.text();
        }
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    async function readJson(file, options) {
        const text = await readText(file);
        const parser = options && typeof options.parse === 'function' ? options.parse : JSON.parse;
        return parser(text);
    }

    function downloadJson(data, options) {
        const fileName = options && options.fileName ? String(options.fileName) : 'config.json';
        const space = options && typeof options.space === 'number' ? options.space : 2;
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, space);
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return fileName;
    }

    global.ConfigTransferRuntime = {
        downloadJson,
        readJson,
        readText
    };
})(window);
