(() => {
    if (typeof window === 'undefined' || window.__MODULE_HELP_RUNTIME_PATCHED__) return;

const SYSTEM_MANUAL = {
    'teacher-analysis': {
        title: '👩‍🏫 教师表现·使用说明',
        fit: `用于<strong>查看每位教师所教班级的学科表现</strong>，发现结构性强项与短板。`,
        when: `成绩导入并完成「任课表同步」之后使用。未同步任课表时本页无数据。`,
        use: `<ul>
                    <li><strong>前提：</strong>必须先在「导入与设置」上传【班级-学科-教师】对应表并同步，否则系统不知道谁教哪个班。</li>
                    <li><strong>看什么：</strong>同学科横向比较各教师所带班级的均分与两率，再结合生源差异判断。</li>
                    <li><strong>注意：</strong>单次考试、单个班级样本有限，名次波动是正常的；建议连续看 2-3 次考试的趋势，不要用一次结果下结论。</li>
                  </ul>`,
        calc: `教师指标由其任教班级的学生成绩聚合而来，口径与「两率一分对比」一致。<br>
                   本页<strong>不做生源校正</strong>——班级生源差异会体现在结果里，解读时需一并考虑。`
    },
    'student-details': {
        title: '🧑‍🎓 学生成绩明细·使用说明',
        fit: `用于<strong>按单个学生查看各科成绩、班级与排名</strong>，是家长会与个别辅导的主要依据。`,
        when: `需要了解某个学生的具体情况、或为家长沟通做准备时使用。`,
        use: `<ul>
                    <li>支持按姓名搜索定位学生。</li>
                    <li>成绩与排名均以「本次 / 上次 / 变化」三段呈现，便于直接看出变化方向。</li>
                    <li>历史数据尚未同步到位时，会显示当前真实排名与「暂无对比」，不会编造对比值。</li>
                  </ul>`,
        calc: `排名口径与全系统一致（同分并列）。缺考、空分按系统统一规则处理，详见「数据检查」。`
    },
    'marginal-push': {
        title: '🎯 临界学生·使用说明',
        fit: `用于<strong>找出差一点就能上线的学生</strong>，把辅导力量集中在提分性价比最高的人身上。`,
        when: `成绩分析完成后、安排下一阶段补弱辅导时使用。`,
        use: `<ul>
                    <li>先选学校，再设「临界分值」（即距目标线多少分以内算临界）。</li>
                    <li><strong>拟优：</strong>距优秀线还差一点的学生。<strong>拟合格：</strong>距及格线还差一点的学生。可只看其中一类。</li>
                    <li>可导出「临界生精准辅导任务单」，按班级分发给科任教师。</li>
                  </ul>`,
        calc: `<div class="formula-box">临界生判定：目标线 − 设定分值 ≤ 学生分数 &lt; 目标线</div>
                   目标线即系统中的优秀线 / 及格线。放大「临界分值」会纳入更多学生，缩小则更聚焦。`
    },
    'progress-analysis': {
        title: '📈 进步与增值·使用说明',
        fit: `用于<strong>看学生相比上次考试是进步还是退步</strong>，而不只看这一次的绝对分数。`,
        when: `至少有两次考试数据后使用。只有一次考试时本页没有对比结果。`,
        use: `<ul>
                    <li>选择学校与对比期数，生成进退步名单。</li>
                    <li>页面会统计「进步 / 退步 / 稳定」人数，可按班级查看分布。</li>
                  </ul>`,
        calc: `<strong>优先按名次变化判定：</strong>名次前进为「进步」，后退为「退步」，不变为「稳定」；<br>
                   缺少名次数据时才退回按分数差判定。<br>
                   <strong>为什么分数涨了却显示退步？</strong>因为整体都涨了、该生名次相对后退——这正是用名次而非绝对分的原因，可避免试卷难易变化造成误判。`
    },
    'data-quality': {
        title: '🔍 数据检查·使用说明',
        fit: `用于<strong>在正式分析之前发现数据问题</strong>，避免用错数据得出错误结论。`,
        when: `每次导入成绩之后、开始看任何分析结果之前，都建议先过一遍这里。`,
        use: `<ul>
                    <li>检查缺失、重复、异常记录。发现问题回到「导入与设置」修正后重新导入。</li>
                    <li><strong>重名学生</strong>最容易造成串号：同名同姓会导致成绩或历史对比接错人，建议补充考号精确匹配。</li>
                    <li>空分与零分的区别请配合「空分与零分核对」一并确认——两者对均分的影响完全不同。</li>
                  </ul>`,
        calc: `本页只做检查与提示，<strong>不会自动修改任何成绩数据</strong>。`
    },
    'report-generator': {
        title: '📤 成绩反馈·使用说明',
        fit: `用于<strong>生成发给学生和家长的成绩单</strong>，以及家长自助查询页面。`,
        when: `成绩核对无误、确认可以对外发布之后使用。`,
        use: `<ul>
                    <li>可生成单个学生成绩单，也可批量生成后打印分发。</li>
                    <li>成绩单包含各科成绩与「本次 / 上次 / 变化」对比，便于家长直观理解孩子的变化。</li>
                    <li><strong>对外发布前请先自查一遍：</strong>确认本校名称、考试名称、科目齐全，避免错误信息发到家长手中后再回收。</li>
                  </ul>`,
        calc: `<strong>家长端排名披露：</strong>考虑到部分地区不允许向家长公布学生具体排名，
                   家长成绩卡片<strong>默认只显示所处区间</strong>（如「年级前 30%」）而非具体名次。<br>
                   学校确认当地政策允许后可恢复显示具体排名，请联系系统管理员调整。`
    },
    'upload': {
        title: '📁 数据上传与设置·使用说明',
        fit: `用于<strong>导入并规范化成绩数据</strong>，为后续所有分析提供可靠数据基础。`,
        when: `每次考试结束后、首次使用或更换数据来源时使用。`,
        use: `<ul>
                    <li><strong>上传文件：</strong>点击虚线框，选择从考务系统导出的原始Excel（支持多选）。系统会自动识别“姓名、班级、科目”。</li>
                    <li><strong>教师配置：</strong>若要进行“教师教学评价”，请在下方“教师信息配置”处上传【班级-学科-教师】对应表。</li>
                    <li><strong>进退步基准：</strong>若要分析进退步，请在“历史成绩档案库”上传上次考试的成绩文件。</li>
                  </ul>`,
        calc: `系统自动清洗数据，缺考/作弊记为0分。`
    },
    'macro': {
        title: '🏆 镇域宏观横向评价·算法说明',
        fit: `用于<strong>校际横向对比</strong>与镇域整体水平研判。`,
        when: `需要对各校进行整体排名、阶段性质量对比或迎检材料汇总时使用。`,
        use: `用于教育组/教研室查看全镇各校排名。点击“生成横向对比表”可查看详细数据。`,
        calc: `<strong>核心公式：两率一分总分 = (均分赋分 + 优率赋分 + 及格赋分)</strong>
                   <div class="formula-box">
                   均分赋分 = (本校均分 ÷ 全镇最高均分) × 权重(60/50)<br>
                   优率赋分 = (本校优率 ÷ 全镇最高优率) × 权重(70/80)<br>
                   及格赋分 = (本校及格 ÷ 全镇最高及格) × 权重(70/50)
                   </div>
                   * 6-8年级权重：60/70/70；9年级权重：50/80/50。`
    },
    'high-score': {
        title: '🌟 9年级高分段核算·算法说明',
        fit: `用于<strong>尖子生培养</strong>与拔尖人才监测。`,
        when: `中考备考阶段或重点关注拔尖学生结构时使用。`,
        use: `仅针对 9 年级中考备考。统计总分 ≥ 490分 (可配置) 的尖子生情况。`,
        calc: `<div class="formula-box">得分 = (本校高分率 ÷ 全镇最高高分率) × 50</div>
                   旨在鼓励学校培养拔尖人才。`
    },
    'value-added': {
        title: '📈 增值性评价·算法说明',
        fit: `用于<strong>衡量真实教学增值</strong>，避免仅看入口生源。`,
        when: `有上次成绩可对比、需要评价教学贡献与进步空间时使用。`,
        use: `解决“生源差”学校的评价不公问题。需先在【进退步追踪】模块上传“上次成绩”。`,
        calc: `<div class="formula-box">平均增值 = (入口平均排名 - 出口平均排名)</div>
                   正数代表进步，负数代表退步。例如：某校入口均名500，出口均名450，增值 = +50 (大进步)。`
    },
    'bottom3': {
        title: '📉 后1/3学生核算·规则说明',
        fit: `用于<strong>低分率监控</strong>与后进生转化跟踪。`,
        when: `需要识别薄弱学校或班级、制定扶弱计划时使用。`,
        use: `关注“后进生”转化情况，防止低分率过高。`,
        calc: `1. 找出全校总分后 1/3 的学生。<br>
                   2. 剔除其中最低分的 <strong>5% (或6%)</strong> (不计入考核，视为特困生)。<br>
                   3. 计算剩余后进生的平均分作为考核依据。`
    },
    'indicator': {
        title: '🎯 指标生达标核算·算法说明',
        fit: `用于<strong>目标完成度</strong>与指标生达标考核。`,
        when: `有明确指标生任务数，需考核完成度时使用。`,
        use: `点击蓝色按钮“在线调整目标”设定各校任务数。`,
        calc: `<div class="formula-box">
                   得分 = 基础分(满分30) + 附加分<br>
                   基础分 = (实际达标 ÷ 目标人数) × 30 (封顶30)<br>
                   附加分 = (超额人数 ÷ 全镇最大超额数) × 5
                   </div>`
    },
    'summary': {
        title: '📑 综合分析报告·计算方式',
        fit: `用于<strong>汇总全模块成绩</strong>形成总排名报告。`,
        when: `需要一键出具综合汇报或向上级汇报时使用。`,
        use: `点击“生成总排名”汇总所有模块得分。`,
        calc: `<div class="formula-box">非9年级：总榜得分 = 两率一分得分 + 后1/3得分<br>9年级：总榜得分 = 两率一分得分 + 后1/3得分 + 指标生得分 + 高分段赋分(50) + 高中上线率赋分(50)</div>`
    },
    'teacher': {
        title: '👩‍🏫 教师教学质量画像·评价模型',
        fit: `用于<strong>教师教学成效</strong>与班级贡献度分析。`,
        when: `完成教师任课配置后，进行教学质量复盘时使用。`,
        use: `查看每位老师的实绩。需先在数据中心配置【教师任课】。`,
        calc: `<strong>综合绩效分 (默认模型)：</strong><br>
                   <div class="formula-box">30(基准) + 贡献值 + 优率分 + 及格分 - 低分惩罚</div>
                   其中“贡献值” = 班级均分 - 年级均分。`
    },
    'student-diag': {
        title: '🔎 学情深度诊断·原理说明',
        fit: `用于<strong>个人层面诊断</strong>与精准提分。`,
        when: `期中/期末后需要制定个性化提升方案时使用。`,
        use: `寻找提分点。`,
        calc: `<strong>1. 临界生</strong>：距优秀线/及格线在<strong>设定分值以内</strong>的学生。
                   该分值由使用者在「临界学生」页自行设置，并非固定 5 分——放大会纳入更多人，缩小则更聚焦。<br>
                   <strong>2. 偏科挖掘</strong>：总分排名靠前，但单科排名严重滞后的学生。<br>
                   <strong>3. 优劣势透视</strong>：基于 Z-Score (标准分) 判断学科强弱。`
    },
    'tools': {
        title: '🛠️ 教务考务工具·算法说明',
        fit: `用于<strong>教务考务流程化</strong>与日常工作降本。`,
        when: `开学初、考试前后、宣传展示时使用。`,
        use: `包含新生分班、考场编排、座位调整等教务工具。`,
        calc: `<strong>分班算法</strong>：S型蛇形排列 + 均分极差优化 (模拟退火)。<br>
                   <strong>考场编排</strong>：同班互斥逻辑 (自动检测并调换同班相邻考生)。`
    },
    'starter-hub': {
        title: '🚀 新手入口·说明',
        fit: `用于<strong>新教师快速上手</strong>，一步完成核心配置。`,
        when: `第一次使用系统或更换学期/届别后。`,
        use: `按“学期 → 成绩 → 任课 → 教师画像”顺序完成配置。`,
        calc: `本页不计算成绩，只提供流程引导、诊断与快捷入口。`
    }
};

if (SYSTEM_MANUAL.teacher) {
    SYSTEM_MANUAL.teacher.calc = `<strong>当前模型：联考赋分 + 基线校正 + 置信修正</strong><br>
                   <div class="formula-box">教学质量分 = 联考赋分(折算100) × 置信系数 + 基线校正 + 工作量修正</div>
                   联考赋分按系统现有“两率一分”标准计算；基线校正按最近一次历史考试的匹配学生、分层基础与实际结果的超预期差折算。`;
}

function showModuleHelp(key) {
    // 'permissions' 的说明写在 PermissionPolicy 里（与权限规则同处维护，避免两份漂移），
    // 此前 showModuleHelp 只查 SYSTEM_MANUAL，导致「权限说明」按钮落到无信息量的兜底
    // 文案。这里回退到 PermissionPolicy 中同名条目。
    const info = SYSTEM_MANUAL[key]
        || (window.PermissionPolicy && window.PermissionPolicy[key] && window.PermissionPolicy[key].title
            ? window.PermissionPolicy[key]
            : null);
    if (!info) {
        Swal.fire({
            title: '📘 模型说明',
            html: `<div class="help-modal-content">
                        <h4>🎯 适合干什么</h4>
                        <div>用于当前模块的功能理解与使用边界说明。</div>
                        <h4>⏱️ 什么时候用</h4>
                        <div>导入数据后，按业务场景进入相应模块使用。</div>
                        <h4>🧮 计算方式 / 底层逻辑</h4>
                        <div>该模块基于系统统一数据模型进行统计与展示。</div>
                    </div>`,
            width: 600,
            confirmButtonText: '我明白了',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    Swal.fire({
        title: info.title,
        html: `
                <div class="help-modal-content">
                    <h4>🎯 适合干什么</h4>
                    <div>${info.fit || info.use}</div>
                    <h4>⏱️ 什么时候用</h4>
                    <div>${info.when || '适用于日常教学分析与阶段性教学复盘。'}</div>
                    <h4>🧮 计算方式 / 底层逻辑</h4>
                    <div>${info.calc}</div>
                </div>
            `,
        width: 600,
        confirmButtonText: '我明白了',
        confirmButtonColor: '#4f46e5'
    });
}

function ensureModuleHelpButton(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const titleEl = section.querySelector('.sec-head h2') || section.querySelector('.module-desc-bar h3');
    if (!titleEl || titleEl.querySelector('.module-help-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'module-help-btn';
    btn.innerHTML = '<i class="ti ti-info-circle"></i><span>口径说明</span>';
    btn.onclick = () => showModuleHelp(sectionId);
    titleEl.appendChild(btn);
}

    window.SYSTEM_MANUAL = SYSTEM_MANUAL;
    window.showModuleHelp = showModuleHelp;
    window.ensureModuleHelpButton = ensureModuleHelpButton;
    window.__MODULE_HELP_RUNTIME_PATCHED__ = true;
})();
