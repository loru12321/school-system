# school-system

学校成绩分析与教务管理系统。当前仓库维护的是 [schoolsystem.com.cn](https://schoolsystem.com.cn/) 的实际运行代码、构建产物和 Supabase 配套脚本，不是演示模板。

## 访问入口

- 线上站点: [https://schoolsystem.com.cn/](https://schoolsystem.com.cn/)
- GitHub 仓库: [https://github.com/loru12321/school-system](https://github.com/loru12321/school-system)
- 主要分支: `main`

## 功能概览

- `数据管理`: 数据上传、届别管理、考试归档、云端恢复、目标人数与别名规则管理
- `联考分析`: 综合分析、校际对比、多期对比、教师分析、高分段与临界生分析
- `教学管理`: 总览、问题清单、预警中心、整改任务、版本归档
- `学情诊断`: 学生明细、成长报告、历史成绩、进退步分析
- `考务工具`: 校内成绩、智能考场编排、新生均衡分班、级部排课、互助组等

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vite 7、原生 HTML/CSS/JavaScript、Alpine.js、Chart.js、XLSX、html2canvas |
| 构建 | `vite-plugin-singlefile`、`sync-public-assets.mjs`、`inline-scripts.mjs` |
| 云端 | Supabase Database、RLS、Edge Function `edu-gateway-v2`、`@supabase/supabase-js@2` |
| 验收 | Node.js 烟测脚本、`scripts/smoke-all-modules.js`、`scripts/smoke-report-compare.js` |

## 仓库结构

```text
src/                              页面入口与内联脚本
public/assets/js/                 前端运行时代码
dist/                             构建产物
lt.html                           单文件本地验收版本
scripts/                          烟测与专项检查脚本
supabase/functions/edu-gateway/   账号与管理网关
supabase/sql/                     RLS、表结构、账号安全迁移脚本
```

重点文件：

- [src/index.html](src/index.html)
- [public/assets/js/app.js](public/assets/js/app.js)
- [supabase/functions/edu-gateway/index.ts](supabase/functions/edu-gateway/index.ts)
- [supabase/EDGE_GATEWAY_SETUP.md](supabase/EDGE_GATEWAY_SETUP.md)
- [scripts/smoke-all-modules.js](scripts/smoke-all-modules.js)

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建：

```bash
npm run build
```

常用脚本：

```bash
npm run smoke:modules
npm run smoke:report-compare
npm run push
```

## 发布流程

标准流程：

1. 修改源码
2. 运行 `npm run build`
3. 运行 `npm run smoke:modules`
4. 提交并推送 `main`
5. 对线上站点做一次实际登录和关键模块回归

如果这次改动涉及 Supabase：

1. 更新 [supabase/functions/edu-gateway/index.ts](supabase/functions/edu-gateway/index.ts)
2. 重新部署 `edu-gateway-v2`
3. 再执行对应 SQL 脚本
4. 最后做浏览器实测和烟测

## 性能指标

以下指标为 `2026-03-21` 当前构建基线，用于后续回归对比，不代表 Lighthouse 评分：

| 指标 | 当前值 |
| --- | --- |
| `dist/index.html` 大小 | `552,926 bytes` |
| `dist/assets/js/app.js` 大小 | `1,206,780 bytes` |
| `lt.html` 大小 | `2,475,059 bytes` |
| 整站烟测基线 | `npm run smoke:modules` 通过，目标 `errorCount: 0` |

说明：

- 当前仓库仍是“大运行时 + 单文件产物”结构，构建体积较大
- 现阶段的性能回归，优先看“能否稳定构建”和“烟测是否通过”
- 若后续做性能专项，优先方向是模块拆分、脚本按需加载、减少单文件内联体积

## 账号安全现状

`2026-03-21` 起，账号链路按下面的方向收口：

- 浏览器端不再以 `system_users` 作为首选认证通道
- 账号搜索、改密、导出、批量导入/删除统一走 `edu-gateway`
- 云端账号列表只返回 `password_display`，不再返回明文密码
- `system_users` 逐步从明文口令迁移到 `bcrypt` 哈希

相关文件：

- [supabase/sql/003_system_users_password_hardening.sql](supabase/sql/003_system_users_password_hardening.sql)
- [supabase/EDGE_GATEWAY_SETUP.md](supabase/EDGE_GATEWAY_SETUP.md)

建议的生产变更顺序：

1. 先部署新版 `edu-gateway-v2`
2. 再执行 `003_system_users_password_hardening.sql`
3. 最后上线前端，确认浏览器端不再依赖旧直连逻辑

## 验收方法

本地烟测：

```bash
$env:SMOKE_URL='file:///C:/Users/loru/Desktop/system/lt.html'
$env:SMOKE_USER='admin'
$env:SMOKE_PASS='admin123'
$env:SMOKE_COHORT_YEAR='2022'
node scripts/smoke-all-modules.js
```

线上烟测：

```bash
$env:SMOKE_URL='https://schoolsystem.com.cn/'
$env:SMOKE_USER='admin'
$env:SMOKE_PASS='admin123'
$env:SMOKE_COHORT_YEAR='2022'
node scripts/smoke-all-modules.js
```

账号安全改动至少补做这几项：

- 管理员登录
- 普通用户改密
- 账号搜索结果只返回脱敏字段
- 页面不再暴露管理员明文口令

## 版本历史

以下只保留最近一轮连续维护记录，更早历史请直接查看 `git log`：

| 日期 | 提交 | 说明 |
| --- | --- | --- |
| 2026-03-21 | `0ad7f52` | 账号网关兼容层收口 |
| 2026-03-21 | `149250c` | 账号安全链路加固 |
| 2026-03-21 | `adff926` | 自定义考试名称优先级修正 |
| 2026-03-21 | `a89f9db` | 移除“喜报红榜生成”模块 |
| 2026-03-21 | `0798e37` | 同步回退后的校内成绩构建产物 |
| 2026-03-21 | `3016207` | 回退“校内成绩母模块”方案 |
| 2026-03-21 | `7d36f27` | 提升校内成绩为母模块（后续已回退） |
| 2026-03-21 | `d70856b` | 继续收紧校内成绩流程 |
| 2026-03-21 | `3a0834f` | 深化校内成绩本模块隔离 |

## 说明

这个仓库仍在持续整理，当前最主要的技术债有两类：

- 前端大文件运行时拆分与状态收口
- Supabase 权限边界继续从浏览器侧收回到 Edge Function

接手时建议优先看这几个文件：

- [README.md](README.md)
- [supabase/EDGE_GATEWAY_SETUP.md](supabase/EDGE_GATEWAY_SETUP.md)
- [deploy.ps1](deploy.ps1)
