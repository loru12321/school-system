# 代码评审（Gemini Code Assist 格式，2026-11-01）

分支：`fix/gemini-review-2026-11-01`，起点 `8de5e14`。范围：生产 Worker（`src/worker*.js`，约 3,900 行）——认证、账号管理、受管 REST、成绩数据读写。计算公式、权重、排名与导出口径均未改动。

## 摘要

本次发现 **2 个严重（Critical）**、**3 个高（High）**、**2 个中（Medium）** 问题，均已修复，并各自有回归测试（在旧代码上全部复现失败）。最严重的是账号管理接口没有校验 `roles` 数组：任何能编辑账号的角色（班主任、级部主任、教务主任）都可以把一个账号提升为管理员，或用批量导入覆盖管理员账号的密码。

| 严重度 | 问题 | 位置 | 状态 |
| --- | --- | --- | --- |
| 🔴 Critical | `account.update` 可通过 `roles` 授予任意角色、跨校/跨班迁移账号 | `worker-accounts.js` `handleAccountUpdate` | 已修复 |
| 🔴 Critical | `account.upsert_many` 可授予管理员，并可覆盖范围外已有账号（含管理员）的密码 | `worker-accounts.js` `handleAccountUpsertMany` | 已修复 |
| 🟠 High | 降级账号时旧主角色仍留在 `roles_json`，降级不生效 | `handleAccountUpdate` | 已修复 |
| 🟠 High | 级部主任/班主任读取问题反馈时未限定学校，可看到他校同名班级的学生姓名与联系电话 | `worker-rest-policy.js` `resolveIssuesAccess` | 已修复 |
| 🟠 High | 登录限流先查后写，并发请求可绕过 5 次锁定 | `worker-auth.js` 登录限流 | 已修复 |
| 🟡 Medium | 登录接口泄露账号是否存在（响应时间）与是否停用（无需密码） | `performGatewayLogin` | 已修复 |
| 🟡 Medium | 已登录用户的成绩数据响应带 `Cache-Control: public` | `worker-system-data.js` | 已修复 |
| 🟢 Low | 签名正确但载荷无法解码的令牌返回 500 | `worker-crypto.js` `verifyLocalSession` | 已修复 |

## 详细问题

### 🔴 Critical：`account.update` 未校验角色授予范围

**问题**：`accountEditable` 只检查目标账号**当前**是否可编辑，之后 `payload.roles` 被原样写入 `roles_json`；`payload.role` 只拦截 `admin/director` 且只对教务主任检查学校。会话每次都从 `roles_json` 刷新角色（`resolveSession`），`getPrimaryRoleFromRoles` 取最高角色。

**利用**：班主任编辑本班家长账号，提交 `{ role: 'parent', roles: ['parent', 'admin'] }`，该账号下次请求即为管理员；也可把家长改成级部主任或迁到别的学校。

**修复**：新增 `validateAssignedRoles(session, record, alreadyHeld)`——每个**新授予**的角色（以及主角色）都必须满足 `accountEditable(session, 新记录)`，即调用者在修改后的学校/班级范围内仍能管理该角色。账号原有的次要角色保留、不视为授予。管理员不受限。

### 🔴 Critical：批量导入可铸造管理员、接管范围外账号

**问题**：`validateAccountUpsertRow` 只检查行的 `role`，不检查 `roles`；也不检查同名账号是否已存在。`ON CONFLICT(username) DO UPDATE` 会覆盖密码、角色、学校。

**利用**：教务主任导入 `{ username: 'admin', password: '…', role: 'teacher', school: '本校' }`，管理员密码被替换、角色被降级——直接接管或锁死系统管理员；或导入 `roles: ['teacher','admin']` 得到一个新管理员。

**修复**：逐行执行 `validateAssignedRoles`；非管理员导入时，若同名账号已存在且 `accountEditable` 为否，整批拒绝（403），不写入任何行。

### 🟠 High：降级不生效

**问题**：未提供 `roles` 时，`nextRoles = [nextRole, ...existingRoles]`。把教务主任改为教师后 `roles_json` 为 `["teacher","director"]`，层级判断仍返回 `director`。

**修复**：主角色变化时，从继承的角色中去掉旧主角色，其余次要角色保留。

### 🟠 High：问题反馈跨校可见

**问题**：级部主任的范围是 `student_class LIKE '7%'`，班主任是 `student_class = '702'`，都没有 `school` 条件。班级号在各校重复，问题反馈里含学生姓名和家长联系电话。

**修复**：两种范围都加 `school = ?`（会话学校），会话缺学校时拒绝。

### 🟠 High：登录限流存在竞态

**问题**：`getLoginRateLimit` 只在请求开始时检查是否锁定；失败计数在 PBKDF2 校验（约数十毫秒）之后才“读—改—写”。同时发出的几十个请求都能通过检查，且计数互相覆盖。

**修复**：改为在校验密码**之前**用一条原子 `INSERT … ON CONFLICT DO UPDATE … RETURNING` 占用一次尝试；超过额度直接 429，不做哈希。密码正确时清除账号计数，并把这一次退还给 IP 计数（避免同校老师集中登录触发 IP 锁）。测试中 20 个并发请求只有 5 个进入校验；40 位老师从同一 IP 正确登录不会被锁。

### 🟡 Medium：登录信息泄露

**问题**：停用账号在校验密码前就返回 403 `Account disabled`；不存在的账号不做 PBKDF2，响应明显更快。

**修复**：账号不存在时对一个随机哈希做同样的校验；只有密码正确后才返回“已停用”。

### 🟡 Medium：成绩数据被标为可公共缓存

**问题**：`/api/system-data` 读取响应为 `public, s-maxage=20`，这是为了让 Worker 的 `caches.default` 保存边缘副本，但同样的头也发给了浏览器，学校网关、代理或 CDN 可以合法地缓存已登录用户的成绩数据。

**修复**：边缘副本保持原头；离开 Worker 的响应统一改为 `private, max-age=20, stale-while-revalidate=60`。

### 🟢 Low：异常令牌导致 500

签名正确但载荷不是合法 base64url 时，`atob` 抛异常，最终返回 500。现返回 401。需要密钥才能构造，属健壮性问题。

## 验证

新增 `test:account-role-escalation`（已加入 `validate:data` 与 `check:release-fast`），并扩展 `test:managed-rest-access`、`test:worker-auth-security`（改用真实 SQLite）、`test:worker-system-data-auth`。每项修复都先在旧代码上复现失败。

本机通过：`validate:data`（全部）、`test:cloudflare-worker-contract`、`test:worker-entrypoint-contract`、`test:security-hygiene`、`test:d1-migrations-replay`、`test:service-worker-api-auth`、`test:worker-asset-cache-policy`。`check:cloudflare`（`wrangler deploy --dry-run`）需要在 CI 上跑（本机 `node_modules` 为 Windows 版 workerd）。

## 建议（未在本次修改）

| 严重度 | 建议 |
| --- | --- |
| 🟡 Medium | 校领导可读取**所有学校**的 `system_logs`。日志表没有学校列，需要先加列并在写入时由会话填充，才能按校限定。 |
| 🟡 Medium | 校领导/级部主任读取的仍是整届打包数据（已在 2026-10-31 记录）；按学校分片后才能在服务端限制范围。 |
| 🟡 Medium | CSP 仍含 `unsafe-inline`：`public/assets/js` 中约 115 处运行时内联事件需逐模块迁移（已在 2026-10-31 记录）。 |
| 🟢 Low | PBKDF2-SHA256 为 100,000 次（Workers 上限）。OWASP 建议 600,000 次；如需更强，可评估在 Worker 内用 scrypt/Argon2 的 WASM 实现。 |
| 🟢 Low | 会话撤销缓存为每个 isolate 30 秒，撤销后最多 30 秒内其他 isolate 仍放行，属设计取舍。 |
| 🟢 Low | `or=` 过滤可展开出超过 D1 绑定上限的参数，导致 500；可像 `in.()` 一样设上限。 |
| 🟢 Low | 密码经 `normalizeText` 去除首尾空格后再哈希/校验，行为一致但会静默改变用户输入；如要更改需同步迁移。 |
