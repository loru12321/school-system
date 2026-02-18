# 部署指南 (Deployment Guide)

本项目已从单文件重构为基于 **Vite + 模块化结构** 的现代 Web 应用。这种结构更容易开发 App (如使用 Capacitor/Tauri 封装) 并在生产环境中使用。

## 📁 目录结构

*   `src/index.html`: 入口文件 (HTML 骨架)
*   `src/assets/js/`: JavaScript 逻辑 (包含 `cloud.js` 和 `app.js`)
*   `src/assets/css/`: 样式表 (包含 `main.css`)
*   `vite.config.js`: 构建配置
*   `package.json`: 项目依赖

---

## 🚀 步骤 1: 推送到 GitHub (GitHub Pages)

由于你已经在浏览器登录 GitHub，请按以下步骤操作：

1.  **初始化 Git 仓库** (在终端运行):
    ```powershell
    git init
    git add .
    git commit -m "Initial migration to Vite structure"
    ```

2.  **创建 GitHub 仓库**:
    *   在浏览器打开: [https://github.com/new](https://github.com/new)
    *   仓库名填写 `school-system` (或其他你喜欢的名字)。
    *   点击 **Create repository**。

3.  **上传代码**:
    *   复制页面上的 **"…or push an existing repository from the command line"** 下面的命令。
    *   通常是 (将 `你的用户名` 替换为实际 GitHub 用户名):
        ```powershell
        git remote add origin https://github.com/你的用户名/school-system.git
        git branch -M main
        git push -u origin main
        ```
    *   *注意: 如果弹出登录框，请登录你的 GitHub 账号。*

---

## ☁️ 步骤 2: 部署到 Cloudflare Pages

Cloudflare 是部署此类应用的最佳选择，速度快且免费支持自定义域名。

1.  登录 Cloudflare Dashboard。
2.  进入 **Compute (Workers & Pages)** -> **Pages** -> **Connect to Git**。
3.  选择你的 GitHub 账号和刚刚创建的 `school-system` 仓库。
4.  **配置构建设置 (Critical)**:
    *   **Project name**: `school-system`
    *   **Framework preset**: 选择 `Vite` (如果没有，请手动填以下内容)
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
    *   **Root directory**: `/` (或留空)
5.  点击 **Save and Deploy**。

Cloudflare 会自动构建项目并发布。以后你只需 `git push` 到 GitHub，Cloudflare 会自动更新。

---

## 🌐 步骤 3: 绑定域名 (schoolsystem.com.cn)

1.  在 Cloudflare Pages 项目页面，点击 **Custom domains** tab。
2.  点击 **Set up a custom domain**。
3.  输入 `schoolsystem.com.cn`。
4.  Cloudflare 会提示你添加 DNS 记录 (CNAME)。
    *   如果你的域名 DNS 已经在 Cloudflare 托管，它会自动添加。
    *   如果在阿里云/腾讯云，你需要去域名控制台添加 Cloudflare 提供的 CNAME 记录。

---

## 📱 后期制作 App

由于项目现在基于标准 Web 结构：
*   **Android/iOS**: 可以简单地使用 [CapacitorJS](https://capacitorjs.com/) 将 `dist` 目录打包为 App。
*   **Desktop**: 可以使用 [Tauri](https://tauri.app/) 或 [Electron](https://www.electronjs.org/)。

## 🛠️ 本地开发

如果需要修改代码：
1.  安装依赖: `npm install`
2.  启动开发服务器: `npm run dev`
    *   浏览器会自动打开，修改代码会实时热更新。
