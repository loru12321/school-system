# 优化工作交接总结

## 一、基本信息

- **工作日期**：2026-06-27
- **Commit**：`f0db6761` (branch: `main`)
- **Cloudflare 版本**：`8efa3a3a-cb7f-48f3-bf6e-2a9d220962bf`
- **生产地址**：https://schoolsystem.com.cn
- **部署验证**：生产 smoke 20项全部通过

---

## 二、已完成内容

### 安全

| 文件 | 变更 |
|------|------|
| `src/worker-gateway-d1.js` | Session TTL `60*60*12` → `60*60*8`（12h→8h） |
| `supabase/functions/edu-gateway/index.ts` | 同上，与 Worker 保持一致 |
| `public/_headers` | CSP-RO 由"与 CSP 完全相同"改为"监控去掉 `unsafe-eval` 的严格策略"，有实际意义 |

### 依赖管理

| 文件 | 变更 |
|------|------|
| `.npmrc`（新建） | `save-exact=true`，防止未来 `npm install` 引入 `^` 范围 |
| `package.json` | `electron 42.4.1`、`electron-builder 26.15.3`、`playwright 1.58.2`、`esbuild 0.28.1` 全部精确锁定 |
| `package.json` | `gsap`、`tippy.js`、`simplebar`、`ali-oss`、`mime-types`、`@alicloud/*`、`@fontsource/*` 共10个运行时死依赖从 `dependencies` 移入 `devDependencies`（electron-builder 不打包 node_modules，零影响） |

### 死代码

| 文件 | 变更 |
|------|------|
| `src/assets/css/login-instagram-refresh.css` | 删除（无任何引用，合约测试不涉及） |
| `src/assets/css/login-qq-final.css` | 删除（同上） |

### CI/工作流

| 文件 | 变更 |
|------|------|
| `.github/workflows/performance-trend.yml` | 删除重复的 `npm run build` 步骤（原流程 build 两次，每次约1分钟） |

### 配置

| 文件 | 变更 |
|------|------|
| `tsconfig.json`（新建） | `allowJs + checkJs + noEmit`，启用 IDE 类型提示，不介入构建 |
| `wrangler.jsonc` | `compatibility_date` 从 `2026-04-20` 推进到 `2026-06-27` |
| `wrangler.jsonc` | 新增 `"observability": {"enabled": true}`，开启 Cloudflare Worker 日志自动捕获 |

### 数据库

| 文件 | 内容 |
|------|------|
| `supabase/sql/007_add_management_query_indexes.sql`（新建） | 为 `warning_records`、`rectify_tasks` 添加 `(project_key, cohort_id, status, warning_level)` 复合索引（Supabase PostgreSQL） |
| `cloudflare/d1/005_add_warning_query_index.sql`（新建） | 同名复合索引（Cloudflare D1 SQLite） |
| **⚠️ 注意** | 以上两个文件仅为 migration 脚本，**尚未在数据库上执行**，需要手动运行 |

### 文档

| 文件 | 变更 |
|------|------|
| `docs/optimization-backlog.md` | Optimization pass log 追加本次记录 |

---

## 三、测试核验结果（部署前全部通过）

```
test:security-hygiene              ✅
test:cloudflare-worker-contract    ✅
test:service-worker-contract       ✅
test:css-hygiene                   ✅
test:html-hygiene                  ✅
test:docs-hygiene                  ✅
test:maintenance-priority-contract ✅ (120 items guarded)
build-size-budget                  ✅
check:release-fast                 ✅
smoke:prod-minimal                 ✅ (20 checks)
```

---

## 四、被合约测试保护、不可轻动的项目

以下是本次尝试修改后**因合约测试断言失败而撤回**的项目，记录原因备查：

| 项 | 约束位置 | 原因 |
|----|---------|------|
| `workers.dev` CORS 域名 | `test-cloudflare-worker-contract.js:68` | 明确断言"workers.dev origin must remain allowed for diagnostics" |
| `/api/edu_gateway`、`/api/gateway` 路由 | 同上 :29-30 | 合约断言这两个路由必须存在 |
| `sw.js` sync 骨架 | `test-service-worker-contract.js:89` | 断言 `sync-data` 标签必须保留 |
| `mobile-login.css` | `test-css-hygiene.js` | 直接读取并断言必须包含特定 CSS 注释块 |
| `Content-Security-Policy-Report-Only` | `test-security-hygiene.js`、`test-maintenance-priority-contract.js` | 两处明确断言该头必须存在 |

---

## 五、剩余风险

**低风险（可随时处理）：**

- SQL migration 脚本已准备，执行前先在 staging 验证：

```bash
# D1
npx wrangler d1 execute school-system-gateway --file cloudflare/d1/005_add_warning_query_index.sql

# Supabase
# 在 dashboard SQL editor 执行 supabase/sql/007_add_management_query_indexes.sql
```

**中风险（需评估）：**

- `wrangler 4.67.0` 运行时提示有更新（4.105.0），建议择期升级后验证
- Supabase edge function `edu-gateway-v2` 只是 v1 的 wrapper（`import "../edu-gateway/index.ts"`），若客户端全切换到 `/api/edu-gateway` 后可下线，减少冷启动

**高风险（需架构决策）：**

| 项 | 影响范围 | 建议 |
|----|---------|------|
| R2 大文件存储 | `cloud_system_data` 大行读写性能 | Cloudflare 控制台建 bucket → `wrangler.jsonc` 加 `r2_buckets` 绑定，代码已就绪 |
| 去掉 CSP `unsafe-eval` | 所有用 Alpine.js 表达式的页面 | 先统计 `x-on` / `:class` 等 inline 表达式数量，迁移后通过 CSP-RO 日志验证零报告再切换 |
| 移除 `vite-plugin-singlefile` | 整个构建与缓存架构 | 需重新设计 chunk 分割 + 版本管理策略，风险最高，建议单独立项 |

---

## 六、下一步建议

1. **执行 SQL migration**（本次最高价值未上线项）：先 D1 再 Supabase，两个都用 `IF NOT EXISTS`，可反复执行
2. **创建 R2 bucket**：`school-system-cloud-data` → 加 wrangler 绑定 → 大于阈值的 `system_data` 自动走 R2
3. **CSP 监控**：部署后观察 `/api/csp-report` 收到的 CSP-RO 违规报告，当 `unsafe-eval` 相关报告归零时，再从 enforcing CSP 中移除
4. **wrangler 升级**：`4.67 → 4.105` 测试后更新 package.json
