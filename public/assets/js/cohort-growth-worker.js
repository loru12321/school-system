self.onmessage = function (event) {
    const message = event && event.data ? event.data : {};
    if (message.cmd !== 'COMPUTE_COHORT_GROWTH') return;
    const requestId = message.requestId;
    const signature = String(message.signature || '');
    try {
        const studentSeries = {};
        const exams = Array.isArray(message.exams) ? message.exams : [];

        exams.forEach((exam) => {
            const validRows = Array.isArray(exam && exam.rows)
                ? exam.rows.filter((row) => row && Number.isFinite(row.total))
                : [];
            if (!validRows.length) return;

            const totals = validRows.map((row) => row.total);
            const mean = totals.reduce((sum, total) => sum + total, 0) / totals.length;
            const variance = totals.reduce((sum, total) => sum + Math.pow(total - mean, 2), 0) / totals.length;
            const std = Math.sqrt(variance) || 1;
            const sorted = validRows.slice().sort((left, right) => {
                const scoreDiff = right.total - left.total;
                return scoreDiff || left.index - right.index;
            });
            const rankMap = new Map();
            for (let index = 0; index < sorted.length;) {
                const rank = index + 1;
                const total = sorted[index].total;
                let next = index + 1;
                while (next < sorted.length && sorted[next].total === total) next += 1;
                for (let cursor = index; cursor < next; cursor += 1) {
                    const key = sorted[cursor].key;
                    if (key && !rankMap.has(key)) rankMap.set(key, rank);
                }
                index = next;
            }

            validRows.forEach((row) => {
                const key = row.key;
                if (!key) return;
                if (!studentSeries[key]) studentSeries[key] = { name: row.name, class: row.class, z: [], p: [] };
                studentSeries[key].name = row.name || studentSeries[key].name;
                studentSeries[key].class = row.class || studentSeries[key].class;
                const rank = rankMap.get(key) || null;
                const percentile = rank && sorted.length > 1 ? (1 - (rank - 1) / (sorted.length - 1)) : 0.5;
                studentSeries[key].z.push((row.total - mean) / std);
                studentSeries[key].p.push(percentile);
            });
        });

        const calculateStd = (values) => {
            const finiteValues = (values || []).filter(Number.isFinite);
            if (!finiteValues.length) return 0;
            const mean = finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
            const variance = finiteValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / finiteValues.length;
            return Math.sqrt(variance);
        };
        const volatility = [];
        const growth = [];
        Object.values(studentSeries).forEach((student) => {
            const finiteZ = student.z.filter(Number.isFinite);
            const finiteP = student.p.filter(Number.isFinite);
            if (finiteZ.length >= 4) {
                volatility.push({
                    name: student.name,
                    class: student.class,
                    count: finiteZ.length,
                    sigma: calculateStd(finiteZ)
                });
            }
            if (finiteP.length >= 2) {
                const start = finiteP[0];
                const end = finiteP[finiteP.length - 1];
                growth.push({
                    name: student.name,
                    class: student.class,
                    start,
                    end,
                    delta: end - start
                });
            }
        });
        volatility.sort((left, right) => right.sigma - left.sigma);
        growth.sort((left, right) => right.delta - left.delta);
        self.postMessage({
            status: 'ok',
            requestId,
            signature,
            result: { volatility: volatility.slice(0, 50), growth: growth.slice(0, 50) }
        });
    } catch (error) {
        self.postMessage({
            status: 'error',
            requestId,
            signature,
            message: error && error.message ? error.message : String(error)
        });
    }
};
