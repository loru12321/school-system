(function attachExamArrangerCore(root) {
    'use strict';

    if (!root || root.ExamArrangerCore) return;

    const HEADER_ALIASES = Object.freeze({
        studentNo: ['学号', '学籍号', '学生编号', '学生学号'],
        name: ['姓名', '学生姓名', '考生姓名'],
        gender: ['性别'],
        currentClass: ['现班级', '当前班级', '班级', '班'],
        originalClass: ['原班级', '原行政班'],
        totalScore: ['总分', '总成绩', '合计', 'score'],
        exclusionReason: ['不参加原因', '排除原因', '原因', '备注'],
        roomName: ['考场名称', '考场', '考场名'],
        capacity: ['容量', '考场容量', '座位数', '可容纳人数'],
        building: ['教学楼', '楼栋'],
        classroom: ['教室', '教室号'],
        order: ['排序', '顺序', '序号']
    });

    const HEADER_LOOKUP = Object.entries(HEADER_ALIASES).reduce((map, [key, aliases]) => {
        aliases.forEach((alias) => map.set(normalizeText(alias).toLowerCase(), key));
        return map;
    }, new Map());

    const SUBJECT_NAMES = new Set([
        '语文', '数学', '英语', '物理', '化学', '生物', '政治', '道法', '历史', '地理', '体育', '实验'
    ]);

    function normalizeText(value) {
        return String(value ?? '').replace(/\u3000/g, ' ').trim();
    }

    function normalizeClass(value) {
        const text = normalizeText(value).replace(/年级/g, '').replace(/（/g, '(').replace(/）/g, ')');
        if (!text) return '';
        const simple = text.match(/^(\d+)\s*班$/);
        if (simple) return `${Number(simple[1])}班`;
        return text.replace(/\s+/g, '');
    }

    function normalizeNumber(value) {
        if (value === null || value === undefined || normalizeText(value) === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const normalized = normalizeText(value).replace(/,/g, '');
        const number = Number(normalized);
        return Number.isFinite(number) ? number : null;
    }

    function normalizeHeader(value) {
        const text = normalizeText(value);
        return {
            raw: text,
            key: HEADER_LOOKUP.get(text.toLowerCase()) || '',
            isSubject: SUBJECT_NAMES.has(text) || /^(语文|数学|英语|物理|化学|生物|政治|道法|历史|地理|体育|实验)(成绩|分数)?$/.test(text)
        };
    }

    function inferClassFromSheetName(sheetName) {
        const text = normalizeText(sheetName);
        if (/^\d+\s*班$/.test(text)) return normalizeClass(text);
        return '';
    }

    function createIssue(code, message, options = {}) {
        return {
            id: `${code}:${options.fileName || ''}:${options.sheetName || ''}:${options.rowNumber || ''}:${options.key || ''}`,
            code,
            message,
            blocking: options.blocking !== false,
            fileName: options.fileName || '',
            sheetName: options.sheetName || '',
            rowNumber: options.rowNumber || 0,
            studentId: options.studentId || '',
            key: options.key || ''
        };
    }

    function detectSheetKind(sheetName, headers) {
        const headerKeys = new Set(headers.map((header) => header.key).filter(Boolean));
        const name = normalizeText(sheetName);
        if (headerKeys.has('roomName') && headerKeys.has('capacity')) return 'rooms';
        if (headerKeys.has('name') && headerKeys.has('currentClass') && /不参加|排除|缺考名单/.test(name)) return 'exclusions';
        if (headerKeys.has('name') && headerKeys.has('currentClass') && headerKeys.has('exclusionReason') && !headerKeys.has('totalScore')) return 'exclusions';
        if (headerKeys.has('name') && headerKeys.has('originalClass') && headerKeys.has('currentClass')) return 'students-history';
        if (headerKeys.has('name') && headerKeys.has('totalScore') && (headerKeys.has('currentClass') || inferClassFromSheetName(name))) return 'students-current';
        return 'unknown';
    }

    function rowObject(headers, values) {
        const result = {};
        headers.forEach((header, index) => {
            if (header.key) result[header.key] = values[index];
        });
        return result;
    }

    function parseStudentRows({ values, headers, sheet, fileName, sheetOrder, kind }) {
        const records = [];
        const issues = [];
        const sheetClass = inferClassFromSheetName(sheet);
        for (let index = 1; index < values.length; index += 1) {
            const row = values[index] || [];
            if (!row.some((cell) => normalizeText(cell))) continue;
            const mapped = rowObject(headers, row);
            const name = normalizeText(mapped.name);
            const currentClass = normalizeClass(mapped.currentClass || sheetClass);
            const originalClass = normalizeClass(mapped.originalClass);
            const rowNumber = index + 1;
            if (!name) {
                issues.push(createIssue('MISSING_STUDENT_NAME', `第 ${rowNumber} 行缺少姓名`, {
                    fileName, sheetName: sheet, rowNumber
                }));
                continue;
            }
            if (!currentClass) {
                issues.push(createIssue('MISSING_STUDENT_CLASS', `${name} 缺少班级`, {
                    fileName, sheetName: sheet, rowNumber, key: name
                }));
            }
            const subjects = {};
            headers.forEach((header, columnIndex) => {
                if (!header.isSubject || !header.raw) return;
                const value = normalizeNumber(row[columnIndex]);
                if (value !== null) subjects[header.raw.replace(/(成绩|分数)$/g, '')] = value;
            });
            const totalScore = normalizeNumber(mapped.totalScore);
            const sourceIdentity = `${fileName}:${sheet}:${rowNumber}`;
            records.push({
                id: normalizeText(mapped.studentNo) || sourceIdentity,
                studentNo: normalizeText(mapped.studentNo),
                name,
                gender: normalizeText(mapped.gender),
                currentClass,
                originalClass,
                totalScore,
                subjects,
                source: {
                    fileName,
                    sheetName: sheet,
                    sheetOrder,
                    rowNumber,
                    kind,
                    references: [{ fileName, sheetName: sheet, sheetOrder, rowNumber, kind }]
                },
                status: totalScore === null ? 'score-missing' : (totalScore === 0 ? 'score-zero' : 'normal'),
                excluded: false,
                exclusionReason: ''
            });
        }
        return { records, issues };
    }

    function parseExclusionRows({ values, headers, sheet, fileName }) {
        const records = [];
        for (let index = 1; index < values.length; index += 1) {
            const row = values[index] || [];
            if (!row.some((cell) => normalizeText(cell))) continue;
            const mapped = rowObject(headers, row);
            const name = normalizeText(mapped.name);
            if (!name) continue;
            records.push({
                studentNo: normalizeText(mapped.studentNo),
                name,
                currentClass: normalizeClass(mapped.currentClass),
                reason: normalizeText(mapped.exclusionReason),
                source: { fileName, sheetName: sheet, rowNumber: index + 1 }
            });
        }
        return records;
    }

    function parseRoomRows({ values, headers, sheet, fileName }) {
        const records = [];
        const issues = [];
        for (let index = 1; index < values.length; index += 1) {
            const row = values[index] || [];
            if (!row.some((cell) => normalizeText(cell))) continue;
            const mapped = rowObject(headers, row);
            const name = normalizeText(mapped.roomName);
            const capacity = normalizeNumber(mapped.capacity);
            if (!name || capacity === null || capacity <= 0) {
                issues.push(createIssue('INVALID_ROOM_CONFIG', `考场配置第 ${index + 1} 行缺少有效名称或容量`, {
                    fileName, sheetName: sheet, rowNumber: index + 1
                }));
                continue;
            }
            records.push({
                id: `room:${normalizeText(name)}`,
                name,
                capacity: Math.floor(capacity),
                building: normalizeText(mapped.building),
                classroom: normalizeText(mapped.classroom),
                order: normalizeNumber(mapped.order) ?? records.length + 1
            });
        }
        return { records, issues };
    }

    function inspectWorkbook({ name, workbook, xlsx }) {
        if (!workbook || !Array.isArray(workbook.SheetNames)) throw new Error('无效的工作簿');
        if (!xlsx?.utils?.sheet_to_json) throw new Error('缺少 SheetJS 运行时');
        const fileName = normalizeText(name) || '未命名工作簿';
        const sheets = workbook.SheetNames.map((sheetName, sheetOrder) => {
            const worksheet = workbook.Sheets[sheetName];
            const values = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
            const headers = (values[0] || []).map(normalizeHeader);
            const kind = detectSheetKind(sheetName, headers);
            let records = [];
            let issues = [];
            if (kind === 'students-current' || kind === 'students-history') {
                ({ records, issues } = parseStudentRows({
                    values, headers, sheet: sheetName, fileName, sheetOrder, kind
                }));
            } else if (kind === 'exclusions') {
                records = parseExclusionRows({ values, headers, sheet: sheetName, fileName });
            } else if (kind === 'rooms') {
                ({ records, issues } = parseRoomRows({ values, headers, sheet: sheetName, fileName }));
            }
            return {
                name: sheetName,
                order: sheetOrder,
                kind,
                headers: headers.map((header) => header.raw),
                records,
                issues,
                rowCount: Math.max(0, values.length - 1)
            };
        });
        return { name: fileName, sheets };
    }

    function studentMatchKey(student) {
        if (student.studentNo) return `no:${student.studentNo}`;
        if (student.name && student.currentClass) return `name-class:${student.name}:${student.currentClass}`;
        return '';
    }

    function cloneStudent(student) {
        return {
            ...student,
            subjects: { ...student.subjects },
            source: {
                ...student.source,
                references: Array.isArray(student.source?.references) ? student.source.references.map((item) => ({ ...item })) : []
            }
        };
    }

    function mergeImportSources(sources) {
        const sheets = (Array.isArray(sources) ? sources : []).flatMap((source) => source?.sheets || []);
        const issues = sheets.flatMap((sheet) => sheet.issues || []).map((issue) => ({ ...issue }));
        const currentRows = sheets.filter((sheet) => sheet.kind === 'students-current').flatMap((sheet) => sheet.records || []);
        const historyRows = sheets.filter((sheet) => sheet.kind === 'students-history').flatMap((sheet) => sheet.records || []);
        const exclusions = sheets.filter((sheet) => sheet.kind === 'exclusions').flatMap((sheet) => sheet.records || []).map((row) => ({ ...row }));
        const rooms = sheets.filter((sheet) => sheet.kind === 'rooms').flatMap((sheet) => sheet.records || []).map((room) => ({ ...room }))
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
        const students = [];
        const byKey = new Map();

        currentRows.forEach((row) => {
            const student = cloneStudent(row);
            const key = studentMatchKey(student);
            if (key && byKey.has(key)) {
                const existing = byKey.get(key);
                issues.push(createIssue('DUPLICATE_STUDENT', `${student.name} 在当前学生表中重复出现`, {
                    blocking: true,
                    fileName: student.source.fileName,
                    sheetName: student.source.sheetName,
                    rowNumber: student.source.rowNumber,
                    studentId: existing.id,
                    key
                }));
                existing.source.references.push(...student.source.references);
                return;
            }
            students.push(student);
            if (key) byKey.set(key, student);
        });

        historyRows.forEach((row) => {
            const key = studentMatchKey(row);
            const existing = key ? byKey.get(key) : null;
            if (existing) {
                if (!existing.originalClass && row.originalClass) existing.originalClass = row.originalClass;
                if (!existing.gender && row.gender) existing.gender = row.gender;
                existing.source.references.push(...row.source.references);
                return;
            }
            const student = cloneStudent(row);
            students.push(student);
            if (key) byKey.set(key, student);
        });

        exclusions.forEach((exclusion) => {
            let matches = [];
            if (exclusion.studentNo) {
                matches = students.filter((student) => student.studentNo === exclusion.studentNo);
            } else {
                matches = students.filter((student) => student.name === exclusion.name
                    && (!exclusion.currentClass || student.currentClass === exclusion.currentClass));
            }
            if (matches.length === 1) {
                matches[0].excluded = true;
                matches[0].exclusionReason = exclusion.reason;
                matches[0].status = 'excluded';
            } else if (matches.length === 0) {
                issues.push(createIssue('UNMATCHED_EXCLUSION', `排除名单中的 ${exclusion.name} 未匹配到学生`, {
                    blocking: false,
                    fileName: exclusion.source.fileName,
                    sheetName: exclusion.source.sheetName,
                    rowNumber: exclusion.source.rowNumber,
                    key: `${exclusion.name}:${exclusion.currentClass}`
                }));
            } else {
                issues.push(createIssue('AMBIGUOUS_EXCLUSION', `排除名单中的 ${exclusion.name} 匹配到多名学生`, {
                    blocking: true,
                    fileName: exclusion.source.fileName,
                    sheetName: exclusion.source.sheetName,
                    rowNumber: exclusion.source.rowNumber,
                    key: `${exclusion.name}:${exclusion.currentClass}`
                }));
            }
        });

        students.forEach((student, index) => {
            student.id = student.studentNo
                ? `student:${student.studentNo}`
                : `student:${student.name}:${student.currentClass || '未知班级'}:${index + 1}`;
            issues.forEach((issue) => {
                if (!issue.studentId && issue.key === student.name) issue.studentId = student.id;
            });
        });

        return {
            students,
            exclusions,
            rooms,
            issues,
            summary: {
                sourceFiles: Array.isArray(sources) ? sources.length : 0,
                sourceSheets: sheets.length,
                rawStudentRows: currentRows.length + historyRows.length,
                totalStudents: students.length,
                excludedStudents: students.filter((student) => student.excluded).length,
                roomCount: rooms.length
            }
        };
    }

    function createWorkspace(meta = {}) {
        return {
            schemaVersion: 1,
            meta: {
                name: normalizeText(meta.name),
                grade: normalizeText(meta.grade),
                cohortId: normalizeText(meta.cohortId),
                examId: normalizeText(meta.examId)
            },
            step: 1,
            sources: [],
            students: [],
            exclusions: [],
            rooms: [],
            issues: [],
            settings: {
                prefix: normalizeText(meta.prefix),
                serialWidth: 3,
                roomCount: 0,
                maxPerRoom: 0,
                advancedRules: {
                    separateSameClass: false,
                    snakeSeating: false,
                    alternateGender: false
                }
            },
            assignments: [],
            generation: null,
            dirty: false,
            savedAt: ''
        };
    }

    function validateWorkspace(workspace) {
        const students = Array.isArray(workspace?.students) ? workspace.students : [];
        const issues = Array.isArray(workspace?.issues) ? workspace.issues.map((issue) => ({ ...issue })) : [];
        if (!students.length) {
            issues.push(createIssue('NO_STUDENTS', '尚未导入可用于编排的学生', { blocking: true }));
        }
        const eligibleStudents = students.filter((student) => !student.excluded);
        if (students.length && !eligibleStudents.length) {
            issues.push(createIssue('NO_ELIGIBLE_STUDENTS', '排除后没有可参加编排的学生', { blocking: true }));
        }
        const blockingIssues = issues.filter((issue) => issue.blocking);
        return {
            valid: blockingIssues.length === 0,
            issues,
            blockingIssues,
            warnings: issues.filter((issue) => !issue.blocking),
            summary: {
                totalStudents: students.length,
                eligibleStudents: eligibleStudents.length,
                excludedStudents: students.length - eligibleStudents.length,
                zeroOrMissingScoreStudents: eligibleStudents.filter((student) => student.totalScore === null || student.totalScore === 0).length,
                roomCount: Array.isArray(workspace?.rooms) ? workspace.rooms.length : 0
            }
        };
    }

    function naturalCompare(left, right) {
        return normalizeText(left).localeCompare(normalizeText(right), 'zh-CN', {
            numeric: true,
            sensitivity: 'base'
        });
    }

    function scoreGroup(value) {
        const score = normalizeNumber(value);
        if (score === null) return { group: 2, score: null };
        if (score === 0) return { group: 1, score: 0 };
        return { group: 0, score };
    }

    function rankStudents(students) {
        return (Array.isArray(students) ? students : [])
            .filter((student) => student && !student.excluded)
            .map((student, stableIndex) => {
                const score = scoreGroup(student.totalScore);
                return {
                    ...student,
                    subjects: { ...(student.subjects || {}) },
                    _rankingGroup: score.group,
                    _rankingScore: score.score,
                    _stableIndex: stableIndex
                };
            })
            .sort((left, right) => {
                if (left._rankingGroup !== right._rankingGroup) return left._rankingGroup - right._rankingGroup;
                if (left._rankingGroup === 0 && left._rankingScore !== right._rankingScore) {
                    return right._rankingScore - left._rankingScore;
                }
                const classOrder = naturalCompare(left.originalClass || left.currentClass, right.originalClass || right.currentClass);
                if (classOrder) return classOrder;
                const sheetOrder = Number(left.source?.sheetOrder || 0) - Number(right.source?.sheetOrder || 0);
                if (sheetOrder) return sheetOrder;
                const rowOrder = Number(left.source?.rowNumber || 0) - Number(right.source?.rowNumber || 0);
                if (rowOrder) return rowOrder;
                return left._stableIndex - right._stableIndex;
            })
            .map((student, index) => {
                const ranked = { ...student, rank: index + 1 };
                delete ranked._rankingGroup;
                delete ranked._rankingScore;
                delete ranked._stableIndex;
                return ranked;
            });
    }

    function chineseRoomNumber(value) {
        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const number = Number(value);
        if (!Number.isInteger(number) || number <= 0 || number >= 100) return String(value);
        if (number < 10) return digits[number];
        if (number === 10) return '十';
        if (number < 20) return `十${digits[number % 10]}`;
        return `${digits[Math.floor(number / 10)]}十${number % 10 ? digits[number % 10] : ''}`;
    }

    function normalizeRooms(rooms) {
        return (Array.isArray(rooms) ? rooms : [])
            .map((room, index) => ({
                id: normalizeText(room.id) || `room-${index + 1}`,
                name: normalizeText(room.name) || `第${chineseRoomNumber(index + 1)}考场`,
                capacity: Math.max(0, Math.floor(normalizeNumber(room.capacity) || 0)),
                building: normalizeText(room.building),
                classroom: normalizeText(room.classroom),
                order: normalizeNumber(room.order) ?? index + 1
            }))
            .sort((left, right) => left.order - right.order || naturalCompare(left.name, right.name));
    }

    function deriveBalancedRooms(studentCount, options = {}) {
        const total = Math.max(0, Math.floor(normalizeNumber(studentCount) || 0));
        if (Array.isArray(options.rooms) && options.rooms.length) return normalizeRooms(options.rooms);
        let roomCount = Math.max(0, Math.floor(normalizeNumber(options.roomCount) || 0));
        const maxPerRoom = Math.max(0, Math.floor(normalizeNumber(options.maxPerRoom) || 0));
        if (!roomCount && maxPerRoom) roomCount = total ? Math.ceil(total / maxPerRoom) : 0;
        if (!roomCount || !total) return [];
        const base = Math.floor(total / roomCount);
        const remainder = total % roomCount;
        return Array.from({ length: roomCount }, (_, index) => ({
            id: `room-${index + 1}`,
            name: `第${chineseRoomNumber(index + 1)}考场`,
            capacity: base + (index < remainder ? 1 : 0),
            building: '',
            classroom: '',
            order: index + 1
        }));
    }

    function normalizeAdvancedRules(rules = {}) {
        return {
            separateSameClass: rules.separateSameClass === true,
            snakeSeating: rules.snakeSeating === true,
            alternateGender: rules.alternateGender === true
        };
    }

    function assignStudents(students, rooms, settings = {}) {
        const ranked = rankStudents(students, settings);
        const normalizedRooms = normalizeRooms(rooms);
        const totalCapacity = normalizedRooms.reduce((sum, room) => sum + room.capacity, 0);
        if (totalCapacity < ranked.length) {
            return {
                ok: false,
                code: 'ROOM_CAPACITY_SHORTFALL',
                shortfall: ranked.length - totalCapacity,
                assignments: [],
                rooms: normalizedRooms.map((room) => ({ ...room, students: [] })),
                summary: { eligibleStudents: ranked.length, totalCapacity },
                warnings: [],
                generationSignature: ''
            };
        }
        const prefix = normalizeText(settings.prefix);
        const serialWidth = Math.max(1, Math.floor(normalizeNumber(settings.serialWidth) || 3));
        const advancedRules = normalizeAdvancedRules(settings.advancedRules);
        const assignedRooms = normalizedRooms.map((room) => ({ ...room, students: [] }));
        const assignments = [];
        let roomIndex = 0;

        ranked.forEach((student, index) => {
            while (assignedRooms[roomIndex] && assignedRooms[roomIndex].students.length >= assignedRooms[roomIndex].capacity) {
                roomIndex += 1;
            }
            const room = assignedRooms[roomIndex];
            const seatNo = room.students.length + 1;
            const assignment = {
                ...student,
                examNo: `${prefix}${String(index + 1).padStart(serialWidth, '0')}`,
                roomId: room.id,
                roomName: room.name,
                roomNo: roomIndex + 1,
                seatNo
            };
            room.students.push(assignment);
            assignments.push(assignment);
        });

        const signaturePayload = {
            students: assignments.map((student) => student.id),
            rooms: assignedRooms.map((room) => ({ id: room.id, name: room.name, capacity: room.capacity })),
            prefix,
            serialWidth,
            advancedRules
        };
        const zeroOrMissing = assignments.filter((student) => normalizeNumber(student.totalScore) === null || normalizeNumber(student.totalScore) === 0);
        return {
            ok: true,
            assignments,
            rooms: assignedRooms,
            summary: {
                eligibleStudents: assignments.length,
                excludedStudents: Math.max(0, (Array.isArray(students) ? students.length : 0) - assignments.length),
                roomCount: assignedRooms.filter((room) => room.students.length).length,
                totalCapacity,
                zeroOrMissingScoreStudents: zeroOrMissing.length
            },
            warnings: zeroOrMissing.length ? [{
                code: 'ZERO_OR_MISSING_SCORE_INCLUDED',
                count: zeroOrMissing.length,
                message: `${zeroOrMissing.length} 名零分或成绩缺失学生已保留在编排中`
            }] : [],
            generationSignature: JSON.stringify(signaturePayload)
        };
    }

    root.ExamArrangerCore = Object.freeze({
        createWorkspace,
        inspectWorkbook,
        mergeImportSources,
        validateWorkspace,
        rankStudents,
        deriveBalancedRooms,
        assignStudents,
        normalizeText,
        normalizeClass,
        normalizeNumber,
        detectSheetKind
    });
})(typeof window !== 'undefined' ? window : globalThis);
