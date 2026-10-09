(function attachExamArrangerDocx(root) {
    'use strict';

    if (!root || root.ExamArrangerDocx) return;

    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    function xmlEscape(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;'
        }[character]));
    }

    function run(text, options = {}) {
        const color = options.color ? `<w:color w:val="${options.color}"/>` : '';
        const size = options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : '';
        const bold = options.bold ? '<w:b/><w:bCs/>' : '';
        const font = options.font ? `<w:rFonts w:ascii="${options.font}" w:hAnsi="${options.font}"/>` : '';
        return `<w:r><w:rPr>${bold}${color}${size}${font}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
    }

    function paragraph(content, options = {}) {
        const align = options.align ? `<w:jc w:val="${options.align}"/>` : '';
        const spacing = options.spacing ? `<w:spacing w:before="${options.spacing.before || 0}" w:after="${options.spacing.after || 0}"/>` : '';
        const pageBreak = options.pageBreakBefore ? '<w:pageBreakBefore/>' : '';
        return `<w:p><w:pPr>${align}${spacing}${pageBreak}</w:pPr>${content}</w:p>`;
    }

    function cell(content, options = {}) {
        const width = options.width ? `<w:tcW w:w="${options.width}" w:type="dxa"/>` : '';
        const shading = options.shading ? `<w:shd w:fill="${options.shading}"/>` : '';
        const borders = options.borders === false ? '' : '<w:tcBorders><w:top w:val="single" w:sz="12" w:color="000000"/><w:left w:val="single" w:sz="12" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:color="000000"/><w:right w:val="single" w:sz="12" w:color="000000"/></w:tcBorders>';
        return `<w:tc><w:tcPr>${width}${shading}${borders}<w:vAlign w:val="center"/></w:tcPr>${content}</w:tc>`;
    }

    function documentXml(body, options = {}) {
        const orient = options.landscape ? ' w:orient="landscape"' : '';
        const pageWidth = options.landscape ? '16838' : '11906';
        const pageHeight = options.landscape ? '11906' : '16838';
        const margin = options.landscape ? '720' : '540';
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}"><w:body>${body}<w:sectPr><w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"${orient}/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}"/></w:sectPr></w:body></w:document>`;
    }

    function stylesXml() {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W_NS}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/><w:sz w:val="22"/></w:rPr></w:style></w:styles>`;
    }

    function settingsXml() {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="${W_NS}"><w:compat/></w:settings>`;
    }

    function buildDocx(body, options = {}) {
        const zip = new root.JSZip();
        zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>');
        zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>');
        zip.file('word/document.xml', documentXml(body, options));
        zip.file('word/styles.xml', stylesXml());
        zip.file('word/settings.xml', settingsXml());
        return zip.generateAsync({ type: 'uint8array' });
    }

    function roomRange(room) {
        const students = room.students || [];
        return students.length ? `${students[0].examNo || ''} — ${students[students.length - 1].examNo || ''}` : '暂无考生';
    }

    function buildRoomSigns(workspace, generation) {
        const title = workspace?.meta?.name || '考试';
        const grade = workspace?.meta?.grade || '';
        const sections = (generation.rooms || []).filter((room) => room.students?.length).map((room, index) => {
            const prefix = index ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '';
            return `${prefix}${paragraph(run(grade, { size: 34, bold: true }), { align: 'center', spacing: { after: 260 } })}${paragraph(run(title, { size: 28 }), { align: 'center', spacing: { after: 420 } })}${paragraph(run(room.name, { size: 62, bold: true, color: '1D4ED8' }), { align: 'center', spacing: { after: 420 } })}${paragraph(run(`${room.building || ''} ${room.classroom || ''}`.trim(), { size: 26 }), { align: 'center', spacing: { after: 200 } })}${paragraph(run(`人数：${room.students.length}    考号：${roomRange(room)}`, { size: 26 }), { align: 'center' })}`;
        }).join('');
        return buildDocx(sections, { landscape: true });
    }

    function deskLabel(student, room) {
        if (!student) return cell(paragraph(run('', { size: 20 }), { align: 'center' }), { shading: 'F8FAFC' });
        const content = paragraph(run(student.examNo || '', { size: 30, bold: true, color: 'C62828' }), { align: 'center', spacing: { after: 90 } })
            + paragraph(run(student.name || '', { size: 24, bold: true }), { align: 'center', spacing: { after: 60 } })
            + paragraph(run(`${room.name}  ·  ${student.seatNo || ''}号`, { size: 18 }), { align: 'center', spacing: { after: 40 } })
            + paragraph(run(student.currentClass || '', { size: 17, color: '475569' }), { align: 'center' });
        return cell(content, { shading: 'FFFFFF' });
    }

    function buildDeskLabels(room) {
        const students = room.students || [];
        const pageSize = 16;
        const pages = [];
        for (let offset = 0; offset < Math.max(1, students.length); offset += pageSize) {
            const pageStudents = students.slice(offset, offset + pageSize);
            const rows = [];
            for (let row = 0; row < 8; row += 1) {
                const cells = [];
                for (let column = 0; column < 2; column += 1) cells.push(deskLabel(pageStudents[row * 2 + column], room));
                rows.push(`<w:tr>${cells.join('')}</w:tr>`);
            }
            const grid = '<w:tblGrid><w:gridCol w:w="5400"/><w:gridCol w:w="5400"/></w:tblGrid>';
            const props = '<w:tblPr><w:tblW w:w="10800" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>';
            pages.push(`${offset ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}<w:tbl>${props}${grid}${rows.join('')}</w:tbl>`);
        }
        return buildDocx(pages.join(''), { landscape: false });
    }

    async function buildPrintFiles(workspace, generation) {
        if (!generation?.ok) throw new Error('请先生成考场安排');
        const files = { '考场门牌.docx': await buildRoomSigns(workspace, generation) };
        for (const room of (generation.rooms || []).filter((item) => item.students?.length)) {
            files[`桌签/${room.name}桌签.docx`] = await buildDeskLabels(room);
        }
        return files;
    }

    root.ExamArrangerDocx = Object.freeze({
        buildPrintFiles,
        buildRoomSigns,
        buildDeskLabels
    });
})(typeof window !== 'undefined' ? window : globalThis);
