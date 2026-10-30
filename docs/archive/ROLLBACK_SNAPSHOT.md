# 系统状态快照 - 2026-08-21 优化前基准

## Git 状态

**当前提交**: `1dde0e2` (Record performance trend for 17c9b76)
**分支**: main
**状态**: clean (无未提交变更)
**最近提交**:
```
1dde0e2 Record performance trend for 17c9b76
```

## GitHub 远程状态

**Remote**: origin
**URL**: https://github.com/loru12321/schoolsystem.git
**同步状态**: 本地与远程一致

## Cloudflare 生产部署状态

**最后部署时间**: 2026-08-11T02:35:24.050Z
**Worker 版本**: 基于 1dde0e2 构建
**部署 ID**: 37b451ed-9b76-495c-971c-751019eaf9ea
**环境变量**:
- GATEWAY_DATA_DB: school-system-gateway (D1 Database)
- CLOUD_SYSTEM_DATA_DB: school-system-cloud-metadata (D1 Database)
- CLOUD_SYSTEM_DATA_MODE: "primary"

**资产大小**: 156.27 KiB (gzip: 31.78 KiB)
**资产文件数**: 247 files

## Supabase 数据库状态

**最后 SQL 迁移**: `supabase/sql/007-*.sql`
**索引状态**: 复合查询索引已建立

## 计算完整性基准

```json
{
  "rawData": 2176
}
```

**验证命令**: `npm run test:calculation-snapshot:local`

## 构建产物快照

**dist/ 大小**: 7.4M
**关键文件**:
- `dist/index.html`: 278KB (内联所有关键脚本)
- `dist/style-DKN0ss9n.css`: 625KB (643KB 去重后)
- `dist/assets/js/app.js`: 234KB
- `dist/assets/vendor/*`: 3.0M

**构建时间**: ~30-40s (需实测)

## Service Worker 版本

**Cache Version**: `runtime-2362a5a39f05`
**SW 脚本**: 
- `public/sw.js`: 6.5KB
- `public/sw-runtime-4082242a0e3e.js`: runtime cache mapping

## 缓存策略

**Runtime JS**: `no-store, max-age=0, must-revalidate`
**Static Assets**: `public, max-age=31536000, immutable`
**HTML**: `no-store`

## 性能基准

待测量（优化前基准）:
- [ ] 首屏加载时间（TTI）
- [ ] 登录→首屏可交互时间
- [ ] app.js 加载+解析时间
- [ ] LCP (Largest Contentful Paint)
- [ ] FID (First Input Delay)

## 回退命令

### 本地回退
```bash
git reset --hard 1dde0e2
git clean -fd
npm install
npm run build
```

### GitHub 回退
```bash
git push origin main --force
```

### Cloudflare 回退
```bash
npm run deploy:cloudflare:verified
```

### 计算验证
```bash
npm run test:calculation-snapshot:local
# 必须输出: "rawData": 2176
```

## 优化计划

参见 `docs/optimization-plan-20260821.md`

---
**快照创建时间**: 2026-08-21T00:00:00+08:00
**创建者**: AI 优化系统
**目的**: 为即将进行的系统优化建立可靠的回退点
