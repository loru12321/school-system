# 优化工作交接总结（2026-06-27 第二轮）

## 一、基本信息

- **工作日期**：2026-06-27
- **远端**：`loru`（github.com/loru12321/school-system），推送目标 `loru main`
- **当前 HEAD**：`44605c44`（已推送到 `loru/main`，工作树干净，零分叉）
- **生产地址**：https://schoolsystem.com.cn
- **线上验收**：生产 smoke 20/20 全部通过

---

## 二、本轮已完成（全部已 push 到 loru/main）

### 1. Douyin 浅色风格 UI 改版

- 登录页（`responsive-login-final.css`）：白色 canvas，styleboard 改为三张 Douyin cover-card（红/橙/青渐变封面 + 标题 + 说明），提交按钮、输入框焦点、角色标签页、品牌 mark 全部改为抖音红 `#FE2C55`。
- 系统内页（`editorial-control-system.css`）：主色 token `--de-violet` 由 `#7265c7` 改为 `#FE2C55`，主按钮、侧边栏/模块栏激活项、输入框焦点一并更新。
- 提交：`144340b0`（主改动）、`0b28d045`（CSS size trim，保持 dist app CSS 在 640000 bytes 预算内）。

### 2. D1 warning index migration

- 执行：`npx wrangler d1 execute school-system-gateway --remote --file cloudflare/d1/005_add_warning_query_index.sql`
- 验证：`EXPLAIN QUERY PLAN` 确认 `SEARCH warning_records USING INDEX idx_warning_records_query`。

### 3. wrangler 4.67 → 4.105

- `npm install --save-dev wrangler@4.105.0`，deploy:cloudflare:verified 通过，smoke 20/20。
- 提交：`3247e7e9`。

### 4. 移除 CSP `unsafe-eval`

- `public/assets/js/freshman-exam-runtime.js`：`window.eval(cryptoJsSource)` → `<script src>` 动态注入（同源资产，`'self'` 覆盖，不需要 eval）。
- `public/_headers`：enforcing CSP 删除 `'unsafe-eval'`（Report-Only 早已删除，两条现在一致）。
- `scripts/test-security-hygiene.js` + `scripts/test-maintenance-priority-contract.js`：删除"临时允许 unsafe-eval"的断言（共两处）。
- 生产验证：`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` ✅
- 提交：`44605c44`。

---

## 三、推送记录

每次推送前均对 `loru/main` 做 rebase（保持线性历史），再 fast-forward push。最终 HEAD `44605c44`，`rev-list --left-right --count loru/main...HEAD` = `0 0`。

注：每轮 push 前 `.claude/settings.local.json` 需临时 stash（权限系统自动修改此文件，不应提交）。

---

## 四、未完成 / 待决策

### Supabase 索引

已迁移到当前 `school-system` Supabase 项目并完成索引创建：

- `idx_warning_records_query`
- `idx_rectify_tasks_query`

### edu-gateway-v2（用户决定保留）

`supabase/functions/edu-gateway-v2/index.ts` 是单行 `import "../edu-gateway/index.ts"` 的空壳 wrapper。客户端已全走 CF Worker，v2 只是备用 fallback URL。用户本轮选择不删除，保留现状。

### R2 大文件存储（用户决定跳过）

代码路径已在 `src/worker-dummy.js:196-341` 实现完毕，只需：
1. Cloudflare Dashboard → R2 Object Storage → 开通（需绑定支付）
2. `npx wrangler r2 bucket create school-system-cloud-data`
3. `wrangler.jsonc` 加 `r2_buckets` 绑定（binding: `CLOUD_SYSTEM_DATA_BUCKET`）
4. deploy 后可选跑迁移脚本（存量 D1 大行搬到 R2）

### vite-plugin-singlefile 移除（建议单独立项）

最高风险。移除后 Vite 产出带哈希文件名的 chunk，`runtime-cache-version` token 机制需重设计。不建议在常规迭代中处理，应单独立项。

---

## 五、被合约测试保护、不可轻动

| 项 | 约束位置 | 原因 |
|----|---------|------|
| `workers.dev` CORS 域名 | `test-cloudflare-worker-contract.js:68` | 断言必须保留供诊断 |
| `/api/edu_gateway`、`/api/gateway` 路由 | 同上 :29-30 | 断言这两路由必须存在 |
| `sw.js` sync 骨架 | `test-service-worker-contract.js:89` | 断言 `sync-data` 标签必须保留 |
| `mobile-login.css` 注释块 | `test-css-hygiene.js` | 断言必须含 `Login Poster Endcap`、`Final QQ Desktop Tune` |
| `Content-Security-Policy-Report-Only` 头 | `test-security-hygiene.js`、`test-maintenance-priority-contract.js` | 两处断言该头必须存在 |
| `product-redesign.css` Favorite 标记字符串 | `test-css-hygiene.js` | 8 个 favorite-theme marker 必须保留 |
| dist app CSS | `test-build-size-budget.js` | 固定上限 640000 bytes，不可修改断言 |

---

## 六、下一步（你回来时）

1. **Supabase 索引**：在 SQL Editor 逐条执行第四节两条语句，然后执行三条验证查询。
2. 其余 backlog 各项按第四节评估结论各自决策。
