# CSP：移除 script-src 'unsafe-inline' 的推进记录

## 本次完成（2026-11-01，分支 `fix/csp-inline-handlers`）

- `public/assets/js` 中运行时拼接 HTML 的 **122 处内联事件**（`onclick` / `onchange` / `oninput` / `onmouseover` 等）全部改为声明式属性，另有 2 处 `href="javascript:void(0)"` 改为 `href="#"`。
  - 通用调用：`uiDeclaredAttrs('click' | 'change' | 'input', '函数名', ...参数)` 生成 `data-ui-action|change|input="call" data-ui-call="…" data-ui-args="<JSON>"`，由 `ui-actions-runtime.js` 统一分发；只有 `DECLARED_CALLS` 白名单中的函数可被调用，参数以 JSON 数据传递，不再拼成 JS 源码。
  - 占位符：`"$this"`（原 `fn(this)`）、`"$event"`（原 `fn(…, event)`）、`"$value"`。
  - `data-ui-stop`：原 `onclick="event.stopPropagation()"`，其内部点击不会触发外层动作（学生明细筛选菜单）。
  - `data-ui-self-only`：原 `if(event.target===this)`，只响应元素自身（登录弹层遮罩）。
  - 具名动作：`scroll-into-view`、`delete-current-exam-cloud-backup`、`toggle-display-when`；悬停变色改为 CSS 类 `.report-hover-row`、`.fb-scheme-option`。
- 唯一保留的内联事件在新生考试「成绩查询包」里：那是用户下载后本地打开的独立 HTML，不受本站 CSP 约束。
- `index.html` 中 3 段必须内联的 `<script>`（首帧登录态、登录按钮早期点击捕获、设计优化脚本）由构建步骤 `scripts/build/inject-csp-script-hashes.mjs` 在 HTML 压缩后计算 SHA-256，写入 **Content-Security-Policy-Report-Only** 的 `script-src`，替换其中的 `'unsafe-inline'`。

## 为什么先只改 Report-Only

`script-src` 一旦出现哈希，浏览器就会忽略 `'unsafe-inline'`。如果直接写进正式策略，等于立即强制执行。先让 Report-Only 策略收紧：浏览器照常运行，只把「若强制执行会被拦截」的内容上报到 `/api/csp-report`（Workers 日志中的 `[csp-report]`）。

## 下一步

1. 部署后观察 1–2 周 Workers 日志中的 `[csp-report]`，关注 `script-src-attr`（遗漏的内联事件）和 `script-src-elem`（未计入哈希的内联脚本）。
2. 报告为零后，把同样的 `script-src`（哈希 + `'self'`）提升到正式的 `Content-Security-Policy`，由同一构建步骤写入。
3. `'unsafe-eval'` 仍为第三方库（alasql 等）所需，另行评估；`style-src 'unsafe-inline'`（大量内联 style 属性）是独立的后续事项。

## 防回退

- `test:inline-handler-budget`：`public/assets/js` 与 `src/index.html` 不得再出现内联事件或 `javascript:` 链接。
- `test:ui-actions-declared-calls`：占位符、边界、遮罩、具名动作的行为测试，以及 `uiDeclaredAttrs` 的转义往返和白名单覆盖。
- `test:csp-script-hashes`：哈希只写入 Report-Only、跳过模板与外链脚本、重复构建不累积。
