# 移动端外壳 IG 风爆改方案

## 用户拍板的决策
- 范围：整个移动端外壳（顶栏 + 底栏 + 中间内容/sheet 视觉）
- 配色：**纯 IG 黑白灰**（纯白底 #fff、近黑文字 #262626、极细灰线 #dbdbdb，去掉现在的暖粉 #f0527d）
- 底栏：**5 栏**，中间加一个大圆形主按钮
- 中间按钮：点击 = **上传成绩**（`activateModule('upload')`）

## 现状（已摸清）
- shell 由 `mobile-app-runtime.js`(1850行) 建 HTML + 交互；样式 `apk-mobile-shell.css`(799行)
- 配色被 3 个 css 层叠：apk-mobile-shell → layout-refinement(蓝 --ui-accent) → product-redesign(粉 --pd-primary，最后加载，!important 主导)
- 截图那个"模块"方框 = layout-refinement:1848 + product-redesign:1336 用 !important 给 .is-active 强加背景
- 底栏 4 tab：home(工作台)/modules(模块)/quick(最近)/account(我的)，`data-apk-tab` + handleTab 路由
- upload 是合法 module id，activateModule('upload') 可进上传页

## 实现（纯 CSS + 小改 JS，不动信息架构/功能路由）

### 1) 新增 IG 主题变量块（apk-mobile-shell.css 顶部）
在 `body[data-mobile-architecture="apk-v2"]` 覆盖 shell 变量为 IG 黑白灰：
```
--apk-shell-bg:#fafafa; --apk-shell-card:#fff; --apk-shell-card-strong:#fff;
--apk-shell-border:#dbdbdb; --apk-shell-text:#262626; --apk-shell-muted:#8e8e8e;
--apk-accent:#262626;  /* IG 激活态是近黑，不是彩色 */
--apk-shell-shadow:none;  /* IG 去阴影，靠细线分隔 */
```
dark-mode 对应给 IG 暗色（#000 底 / #262626 卡 / #363636 线 / #f5f5f5 字）。

### 2) 压制 layout-refinement + product-redesign 对 shell 的彩色 !important
这两个文件在 apk-mobile-shell 之后加载，必须在 apk-mobile-shell.css **末尾**用同等特异性 + !important 夺回 shell 配色（否则粉/蓝背景压不掉）。新增一段 `/* IG override: neutralize legacy shell accents */`，把 .apk-shell-tab.is-active / .apk-rail-chip.is-active / .apk-sheet-card.is-active 的 background/border/color 归一到 IG 中性值。
（备选：直接改那两个文件里针对 apk-shell 的规则——但它们还管非 shell 元素，风险大；末尾覆盖更隔离。）

### 3) 底栏改 5 栏 + 中间圆按钮（mobile-app-runtime.js buildShellHtml 1156-1173）
tabs 容器插入第 3 位一个特殊按钮：
```
<button class="apk-shell-tab apk-shell-tab-primary" data-apk-tab="create" aria-label="上传成绩">
    <span class="apk-shell-fab"><i class="ti ti-plus"></i></span>
</button>
```
- handleTab 加 `if (tabName === 'create') { activateModule('upload'); return; }`
- renderTabs 的 grid 从 repeat(4) → repeat(5)；create 按钮不参与 is-active 高亮（它是动作不是视图）
- 图标 IG 化：home ti-home、modules ti-layout-grid→ti-search 还是保持？IG 底栏是 首页/搜索/➕/最近/头像。**保持你现有语义**：工作台(ti-home)/模块(ti-layout-grid)/➕上传/最近(ti-history)/我的(ti-user-circle)，只换视觉不换语义。

### 4) 底栏视觉 IG 化（apk-mobile-shell.css .apk-shell-tab 区，已部分改过）
- 去掉整块白底 surface 边框阴影 → 底栏改为纯白 + 顶部 1px 细灰线（IG 底栏就是贴底白条 + hairline）
- tab：无背景方框，图标 24px，激活=近黑实心/加粗，未选=灰；去掉我上一轮加的小圆点（IG 无圆点，靠图标填充态区分）→ 或保留极小圆点，二选一，默认按 IG 无圆点
- `.apk-shell-fab`：44px 圆，IG 渐变或纯黑底 + 白➕；轻微上浮（translateY 让它比其他 tab 略高，像 IG 的强调）
- 修掉点击残留方框（-webkit-tap-highlight-color:transparent + :focus outline none，上一轮已加）

### 5) 顶栏 + sheet/卡片 IG 化
- 顶栏 apk-shell-topbar：去阴影，改 1px 底部细线；标题"校衡台"左对齐、加粗近黑；两侧图标按钮改无底细线圆
- cohort/mode 双胶囊：去粉底 → 白底细灰线圆角（IG story-ring 感可选，先不做）
- sheet/卡片(apk-sheet-card/apk-module-card)：白底 + 1px #dbdbdb + 圆角 8px + 无重阴影；激活态近黑边框而非粉底

## 验证
- 视觉是主观的 → 用 preview 服务器 + 截图（mobile 375px viewport）自查每一步，给你看图确认
- build（integrity）、smoke:modules:local（errorCount=0，确认 shell 不报错）、calc-snapshot 不受影响（纯 UI）
- check:release-fast（含 css/html-hygiene、table-layout-contract 等）
- 不碰计算/口径/数据路径

## 分步交付（每步可回滚 + 截图确认）
1. 底栏：5 栏 + 圆按钮 + IG 黑白灰 tab + 压制彩色 !important（先把你圈的那块彻底改好）
2. 顶栏 IG 化
3. sheet/卡片 IG 化
每步跑 build + 截图给你看，满意再下一步；不满意当步回滚。

## 边界
- 只改 apk-v2 移动外壳（`body[data-mobile-architecture="apk-v2"]:not([data-role=parent])`）；桌面端、家长端不动
- 不改功能、路由、模块白名单、数据；纯视觉 + 底栏加 1 个动作按钮
- product-redesign/layout-refinement 里非 shell 的规则不动（只在 shell 作用域内覆盖）
