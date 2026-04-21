# School System

面向学校成绩分析、联考对比、教师教学诊断、县乡质量排名与教务管理的一体化系统。

当前仓库维护的是正式站点 [schoolsystem.com.cn](https://schoolsystem.com.cn/) 的实际运行代码，而不是演示模板。

## 访问入口

- 正式站点：[https://schoolsystem.com.cn/](https://schoolsystem.com.cn/)
- GitHub 仓库：[https://github.com/hka123321/school-system](https://github.com/hka123321/school-system)
- 默认分支：`main`
- 当前工作区：`C:\Users\loru\Desktop\system\school-system`

## 系统覆盖范围

当前主系统已经覆盖以下核心场景：

- 数据枢纽中心：成绩上传、考试归档、届别管理、目标人数管理、学校别名、云端备份与恢复
- 联考分析：综合总览、两率一分、县域质量排名、教师教学分析、指标生达标、后 1/3 学生核算
- 学情诊断：学生总览、学生明细、成长档案、学生报告、进退步分析
- 教学管理：总览、问题清单、异常预警、整改任务、版本归档
- 教务工具：考务编排、新生均衡分班、应用下载中心

## 当前模块状态

截至 `2026-04-21`，已重新完成本地与线上全模块烟测：

- 本地烟测：`npm run smoke:modules:local` 通过
- 正式站点烟测：`SMOKE_URL=https://schoolsystem.com.cn/ node scripts/smoke-all-modules.js` 通过
- 结果：`errorCount: 0`

已覆盖确认的关键模块包括：

- 综合分析报告
- 镇域宏观横向评价
- 县域质量排名
- 教师教学分析
- 校内绩效管理与评价
- 学科贡献度与关联性分析
- 进退步分析
- 纵向成长档案
- 学生报告生成
- AI 分析统一入口
- 应用下载中心
- 教学管理五个子模块
- 学生总览与学生明细
- 数据枢纽中心全部页签

## 技术架构

前端与构建：

- Vite 7
- 原生 HTML / CSS / JavaScript
- `vite-plugin-singlefile`
- 构建后同步脚本：
  - `scripts/build/sync-public-assets.mjs`
  - `scripts/build/optimize-dist-html.mjs`
  - `scripts/build/inline-scripts.mjs`

前端运行时拆分：

- 主入口：`public/assets/js/app.js`
- 状态层：`*-state-runtime.js`
- 模块层：`*-runtime.js`
- 云端与账户：`cloud-api-runtime.js`、`data-cloud-runtime.js`、`account-manager-runtime.js`
- 登录与壳层：`boot-runtime.js`、`login-entry-runtime.js`、`shell-runtime.js`

云端与网关：

- Supabase 数据库
- Supabase Edge Functions
- 同源代理网关 `/api/edu-gateway`
- Cloudflare Workers

## 仓库结构

```text
src/                               页面入口
public/assets/js/                  前端运行时代码
scripts/                           构建、校验、烟测、部署辅助脚本
dist/                              构建产物
supabase/functions/                Edge Functions
supabase/sql/                      表结构、RLS、迁移脚本
cloudflare/                        Worker 相关文件
docs/                              补充文档
lt.html                            单文件本地版本
deploy.ps1                         部署脚本
wrangler.jsonc                     Workers 部署配置
```

建议优先阅读：

- [README.md](README.md)
- [package.json](package.json)
- [scripts/smoke-all-modules.js](scripts/smoke-all-modules.js)
- [public/assets/js/app.js](public/assets/js/app.js)
- [public/assets/js/data-cloud-runtime.js](public/assets/js/data-cloud-runtime.js)
- [public/assets/js/county-analysis-runtime.js](public/assets/js/county-analysis-runtime.js)

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

全量校验：

```bash
npm run validate
```

## 验证命令

本地全模块烟测：

```powershell
npm run smoke:modules:local
```

正式站点全模块烟测：

```powershell
$env:SMOKE_URL='https://schoolsystem.com.cn/'
node scripts/smoke-all-modules.js
```

对比报告专项烟测：

```powershell
npm run smoke:report-compare
```

AI 网关专项检查：

```powershell
npm run smoke:ai-gateway
```

## 部署流程

标准发布流程：

1. 修改代码
2. 运行 `npm run build`
3. 运行本地烟测
4. 提交并推送到 `main`
5. 部署 Worker / 站点
6. 对正式站点再次跑烟测

仓库内常用命令：

```bash
npm run push
```

如需手动部署 Worker，可参考项目中的 `wrangler.jsonc` 与 `deploy.ps1`。

## GitHub Releases 状态

截至 `2026-04-21`，GitHub Releases 尚未完成客户端同步，当前公共地址检查结果如下：

- [releases/latest](https://github.com/hka123321/school-system/releases/latest)：`404`
- Android 安装包：`school-system-android-latest.apk` 下载地址返回 `404`
- Windows 客户端：`smartedu-desktop-windows-latest.exe` 下载地址返回 `404`

这意味着：

- 安卓客户端当前没有在 GitHub Releases 中对外发布
- Windows 客户端当前也没有在 GitHub Releases 中对外发布
- 如果应用下载中心仍指向 GitHub Releases，需要补齐发布资产或改为稳定的对象存储下载地址

## 当前数据与业务规则要点

系统近阶段已经落地的关键规则包括：

- 同一考试日期时间再次上传时，覆盖本次考试数据
- 没有“目标人数管理”配置的学校，按县直学校处理
- 县域质量排名支持县乡双口径
- 县域质量排名内已纳入下载入口
- 9 年级县域排名支持总分与分学科排名呈现
- 教师在县直 + 乡镇的本学科县域总排名已纳入县域质量排名

## 维护建议

如果继续优化，我建议优先做这三件事：

1. 补齐 GitHub Releases 发布链路，把 Android APK 和 Windows EXE 自动挂到同一个版本标签下。
2. 给“应用下载中心”增加真实发布状态检测，避免页面显示可下载但实际链接 `404`。
3. 继续压缩运行时体积，逐步把高耦合逻辑从 `app.js` 向独立 runtime 拆分，降低后续回归成本。

## 说明

这是生产仓库，提交前建议至少完成：

- `npm run build`
- `npm run smoke:modules:local`
- 正式站点回归一遍关键模块

如果这次修改涉及云端、登录、县域排名、报告导出或数据覆盖逻辑，建议追加正式站点烟测，不要只看本地结果。
