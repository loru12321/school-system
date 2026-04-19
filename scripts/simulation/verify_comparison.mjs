import LZString from 'lz-string';

// 模拟系统环境
const mockData = [
    {
        key: 'STUDENT_COMPARE_2024_EXAM1',
        content: "LZ|" + LZString.compressToUTF16(JSON.stringify({
            school: '实验小学',
            examIds: ['2024秋期中'],
            studentsCompareData: [
                {
                    name: '张三',
                    class: '601',
                    school: '实验小学',
                    periods: [
                        { examId: '2024秋期中', total: 280, rankSchool: 5, rankTown: 10, subjects: { '语文': { score: 95 } } }
                    ]
                }
            ]
        })),
        updated_at: '2024-11-01T10:00:00Z'
    },
    {
        key: 'STUDENT_COMPARE_2024_EXAM2',
        content: "LZ|" + LZString.compressToUTF16(JSON.stringify({
            school: '实验小学',
            examIds: ['2024秋期末'],
            studentsCompareData: [
                {
                    name: '张三',
                    class: '601',
                    school: '实验小学',
                    periods: [
                        { examId: '2024秋期末', total: 290, rankSchool: 2, rankTown: 4, subjects: { '语文': { score: 98 } } }
                    ]
                }
            ]
        })),
        updated_at: '2025-01-15T10:00:00Z'
    }
];

// 模拟辅助函数
function normalizeCompareName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function isClassEquivalent(c1, c2) {
    const n1 = String(c1 || '').replace(/[^0-9]/g, '');
    const n2 = String(c2 || '').replace(/[^0-9]/g, '');
    return n1 === n2 && n1 !== '';
}

// 核心逻辑测试
async function testGetHistoryComparisonData(studentName, className, schoolName) {
    console.log(`测试查询: ${studentName}, ${className}, ${schoolName}`);
    
    // 模拟从 Supabase 获取数据
    const data = mockData;
    const history = [];
    const normalizedTargetName = normalizeCompareName(studentName);
    const normalizedTargetClass = String(className || '').trim();

    for (const item of data) {
        let raw = item.content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            raw = LZString.decompressFromUTF16(raw.substring(3));
        }
        const payload = JSON.parse(raw);
        const sourceRows = payload.studentsCompareData || [];
        
        const matched = sourceRows.find(s => {
            const sameName = normalizeCompareName(s.name || '') === normalizedTargetName;
            const sameClass = !normalizedTargetClass || isClassEquivalent(s.class || '', normalizedTargetClass);
            const sameSchool = !schoolName || String(s.school || '').trim() === String(schoolName).trim();
            return sameName && sameClass && sameSchool;
        });

        if (matched && matched.periods) {
            matched.periods.forEach(p => {
                if (!history.find(h => h.examId === p.examId)) {
                    history.push({
                        examId: p.examId,
                        total: p.total,
                        rankSchool: p.rankSchool,
                        rankTown: p.rankTown,
                        updatedAt: item.updated_at
                    });
                }
            });
        }
    }

    history.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    return history;
}

// 执行验证
const result = await testGetHistoryComparisonData('张三', '601', '实验小学');
console.log('验证结果:', JSON.stringify(result, null, 2));

if (result.length === 2) {
    console.log('✅ 逻辑验证通过：成功提取到2次历史成绩。');
} else {
    console.log('❌ 逻辑验证失败：未能提取到预期的历史成绩。');
}
