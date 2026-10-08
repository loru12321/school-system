# 本地开发指南

## 快速启动

系统已修复本地开发环境配置问题，现在可以正常运行。

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 配置环境变量（已完成）

项目根目录的 `.dev.vars` 文件已包含本地开发所需的环境变量：

```
APP_SESSION_SECRET=local-dev-secret-change-in-production-abc123xyz789
```

⚠️ **重要**: `.dev.vars` 仅用于本地开发，不会提交到版本控制。生产环境使用 Wrangler Secrets 管理敏感配置。

### 4. 启动本地开发服务器

```bash
npx wrangler dev --local --port 8787
```

服务器将在 http://localhost:8787 启动。

## 验证系统运行

### 健康检查

```bash
curl http://localhost:8787/api/health
```

预期返回：
```json
{
  "ok": true,
  "cloudSystemDataBackend": "d1",
  "cloudSystemDataReady": true,
  "cloudSystemDataMode": "primary",
  "gatewayDataBackend": "d1",
  "gatewayDataReady": true,
  "gatewayAuthFallback": "cloudflare-only"
}
```

### 访问主页

在浏览器中打开 http://localhost:8787，应该能看到登录页面。

## 架构说明

本系统是一个部署在 Cloudflare Workers 上的学校数据管理系统，包含以下组件：

- **前端**: Vite 构建的单页应用
- **后端**: Cloudflare Workers (src/worker-*.js)
- **数据库**: Cloudflare D1 (本地开发使用 SQLite)
- **资源**: Cloudflare Workers Assets

### 关键文件

- `wrangler.jsonc` - Cloudflare Workers 配置
- `.dev.vars` - 本地开发环境变量
- `src/worker-dummy.js` - Worker 入口文件
- `src/index.html` - 前端入口

## 常见问题

### Q: 为什么不能使用 `npm run dev`？

A: `npm run dev` 启动的是 Vite 开发服务器，它只能处理静态文件，无法处理 `/api/*` 路由。必须使用 `npx wrangler dev` 来启动完整的 Worker 环境。

### Q: 遇到 "GATEWAY_SECRET_NOT_CONFIGURED" 错误？

A: 确保 `.dev.vars` 文件存在且包含 `APP_SESSION_SECRET`，然后重启 Wrangler。

### Q: 如何查看 Worker 日志？

A: Wrangler 会在终端输出所有 console.log/error 信息。

## 生产部署

生产环境需要配置以下 Secrets：

```bash
npx wrangler secret put APP_SESSION_SECRET
npx wrangler secret put SUPABASE_ORIGIN
npx wrangler secret put SUPABASE_REST_API_KEY
npx wrangler secret put LEGACY_GATEWAY_API_KEY
```

部署命令：

```bash
npm run build
npx wrangler deploy
```

或使用项目的部署脚本：

```powershell
.\deploy.ps1
```
