# 免费安装包交付设计

## 目标

在 GitHub 账户受限且 Cloudflare R2 未启用的情况下，继续通过现有 `schoolsystem.com.cn` 免费提供 Windows 与 Android 安装包，并让版本中心展示最新版本和历史记录。iOS 继续明确显示“等待 Apple 签名”，不伪造可安装 IPA。

## 约束

- 不开通付费产品，不绑定新的付费存储。
- 单个 Cloudflare Workers 静态资源必须小于平台上传上限。
- 大型二进制文件和分片不提交进 Git；仓库只保存生成与校验逻辑。
- 下载结果必须保持原始文件名、字节数与 SHA-256。
- GitHub 恢复后，原有 Releases 自动化仍可继续使用。

## 方案

### 分片生成

新增发布分片脚本，将 `.exe` 和 `.apk` 按不超过 20 MiB 切分到 `dist/releases/packages/<release-tag>/`。脚本同时生成下载映射，记录允许下载的文件名、媒体类型、总字节数、SHA-256 与有序分片路径。

脚本只接受仓库内或系统临时目录中的可信输入，拒绝符号链接、路径穿越、重复文件名和空文件。生成目录属于构建产物，不进入 Git。

### Worker 下载

Worker 增加 `/downloads/<filename>` 入口。它从静态资源绑定读取下载映射，只允许映射中的文件名，然后依次流式读取分片并组成单个响应。响应包含正确的 `Content-Type`、`Content-Length`、`Content-Disposition`、缓存策略与完整文件的 SHA-256 元数据。

`HEAD` 返回与 `GET` 一致的元数据但不传输文件。未知文件、异常映射或缺失分片返回 404/500，不回退到任意静态路径。

首版不支持断点续传；完整下载保持低内存流式输出。后续只有在真实需求出现时再增加 Range 支持。

### 版本目录

公开 `release-manifest.json` 保存首个 Beta 条目：

- Windows：可下载，未做商业代码签名。
- Android：可下载，使用测试签名。
- iOS：等待 Apple 开发者签名。

Windows 与 Android 的 `assetUrl` 指向 `https://schoolsystem.com.cn/downloads/...`。版本中心原有 GitHub 与本地目录合并逻辑保持不变，因此 GitHub 恢复后两种来源可以共存。

## 数据流

1. 本地构建 Windows 与 Android 包。
2. 分片脚本校验原文件并生成分片、下载映射和版本目录。
3. Wrangler 将 Worker 与静态分片一并部署。
4. 版本中心读取公开目录并展示下载入口。
5. 用户点击下载，Worker 按映射顺序流式合并分片。

## 测试与验收

- 契约测试先验证：安全路径、分片尺寸、顺序、总字节数和 SHA-256。
- Worker 测试先验证：白名单下载、HEAD、未知文件、缺失分片和响应头。
- 重新合并已生成分片，结果必须与原文件逐字节一致。
- 线上验证 Windows 与 Android 下载响应状态、文件大小与 SHA-256。
- 执行现有发布快速检查、生产最小验证和计算快照校验。

## 运维与回退

- 每个 Beta 使用不可变目录，90 天后可删除对应分片并从目录移除。
- 稳定版目录永久保留，除非管理员明确执行清理。
- 若部署失败，保留当前 Worker 版本并回滚，不覆盖已有可用版本。
- GitHub 账户恢复后，优先恢复 Actions；Cloudflare 分片可继续作为镜像或逐步下线。

## 非目标

- 不绕过 GitHub 账户限制。
- 不开通 Cloudflare R2、付费 CDN 或第三方收费存储。
- 不提供未经 Apple 签名的 iOS 安装包，也不代替 TestFlight/App Store。
