# 多端应用版本中心设计规格

## 目标

将最后一个“应用下载中心”母模块升级为 Windows、Android、iOS 三端应用版本中心。系统必须展示各平台最新版、近期测试版和永久稳定版，并将每次代码变更、构建结果、安装包、校验值与更新说明关联起来。

## 已确认约束

- 视觉延续现有“校衡台”编辑部式主题，不重做品牌与全局导航。
- 采用“平台聚焦”布局：顶部平台切换、左侧当前版本详情、右侧发布轨迹、底部完整历史入口。
- Android 与 iOS 使用 Capacitor，共享当前 Web 构建产物。
- Windows 使用 Electron Builder 生成 EXE 安装包。
- 当前没有 Apple Developer Program、Android 正式 keystore 或 Windows 代码签名证书。
- 首期 Windows 发布明确标注的未签名测试包；Android 使用独立测试密钥签名，并明确标注“测试签名、不可用于正式发布”。
- 首期 iOS 只生成 Xcode 工程并通过模拟器编译，不伪造可安装 IPA；获得 Apple 账号后再启用 TestFlight 与 App Store 发布。
- `main` 每次提交生成测试构建，保留 90 天；`school-system-v*` 标签生成永久稳定版本。

## 信息架构

### 平台切换

版本中心提供 Windows、Android、iOS 三个平台标签。首次进入时根据当前 User-Agent 选择对应平台，用户可以随时手动切换。每个平台标签同时展示简短状态，例如“最新测试版”“构建失败”或“等待签名”。

### 当前版本详情

当前平台详情展示：

- 版本号与渠道（beta / stable）
- 源提交 SHA 与构建时间
- 最低系统版本和支持架构
- 签名状态
- 安装包名称、大小与 SHA-256
- 更新摘要与完整 Release 入口
- 下载、复制校验值、查看构建状态等操作

安装包缺失或构建失败时必须禁用下载，改为显示构建状态入口，不能保留空链接或占位包。

### 发布轨迹与历史抽屉

右侧发布轨迹展示当前平台最近的测试版和稳定版。完整历史抽屉支持按平台、渠道和日期筛选，并明确区分：

- 测试构建：来自 `main`，保留 90 天并显示剩余时间。
- 稳定版本：来自 `school-system-v*` 标签，永久保留。

窄屏下发布轨迹移动到详情下方，历史抽屉占满可用宽度。

## 封装架构

### Android

在仓库中创建 Capacitor Android 工程，Web 资源来自现有 `dist`。CI 在 Linux Runner 上构建测试 APK。实现阶段生成独立测试密钥，只保存到 GitHub Secrets 和用户的离线备份，不进入仓库；清单标记为 `test-signed`，界面提供安全提示。未来取得正式 keystore 后切换到正式签名产物。

### iOS

创建 Capacitor iOS 工程并共享相同 Web 资源。由于当前开发环境是 Windows，iOS 编译只在 GitHub macOS Runner 或未来配置的 Mac 上执行。首期运行模拟器目标的 `xcodebuild` 编译验证并保存工程构建信息，不发布 IPA 下载。

取得 Apple Developer Program 账号后，新增 App Store Connect API Key、证书和 provisioning profile，并依次启用签名 Archive、TestFlight 上传和 App Store 正式发布。

### Windows

创建轻量 Electron 壳与 Electron Builder 配置，加载正式站点并提供离线/网络错误状态。Windows Runner 生成未签名 EXE 安装包；未来配置代码签名证书后启用签名和可信升级。

## 版本清单

每次构建生成 `release-manifest.json`。顶层字段包含：

- `schemaVersion`
- `releaseTag`
- `channel`
- `sourceSha`
- `generatedAt`
- `expiresAt`（稳定版为空）
- `releaseUrl`
- `platforms`

每个平台记录包含：

- `platform`
- `version`
- `buildNumber`
- `status`
- `signed`
- `minimumOs`
- `architectures`
- `assetName`
- `assetUrl`
- `bytes`
- `sha256`
- `notes`
- `buildUrl`

版本中心优先读取 GitHub Releases 的公开数据并规范化为此模型；读取失败时回退到随站点发布的缓存清单。缓存数据必须标记更新时间，避免被误认为实时状态。

## 自动发布流程

### 测试通道

每次提交进入 `main`：

1. 执行现有语法、运行时、计算、体积、下载和 Cloudflare 发布门禁。
2. Windows、Android、iOS 三个平台并行构建。
3. 每个平台独立报告成功或失败；单个平台失败不隐藏其他平台结果。
4. 汇总构建结果和校验值，创建形如 `beta-YYYYMMDD-<sha>` 的 GitHub prerelease。
5. 更新“latest beta”别名和缓存清单。
6. 定时清理超过 90 天的 prerelease 与对应安装包。

为避免无意义资源消耗，同一分支有新提交时取消尚未开始打包的旧流水线，但已经发布的构建仍按 90 天规则保留。

### 稳定通道

推送 `school-system-v*` 标签时：

1. 重跑完整门禁。
2. 构建三端稳定产物。
3. 生成不可变文件名、Release 说明和清单。
4. 创建永久 GitHub Release，不参与测试版清理。
5. 更新版本中心的稳定版与历史记录。

在正式签名凭据缺失期间，稳定发布必须清楚标记 Windows 未签名、Android 仅测试签名，iOS 标记为“等待签名”，不得显示不存在的 App Store 或 TestFlight 链接。

## 错误与安全状态

- GitHub API 或网络不可用：显示缓存版本和更新时间，并提供重试。
- 平台构建失败：显示失败状态、构建链接和上一个可用版本。
- 安装包缺失、体积异常或校验值缺失：发布门禁失败，不创建下载链接。
- 未签名或仅测试签名的安装包：下载前显示平台对应风险提示和安装步骤。
- 签名密钥与商店凭据只能保存在 GitHub Secrets 或平台密钥库中，不能进入仓库、构建日志或版本清单。
- TestFlight/App Store 未配置时，iOS 只展示接入进度和工程状态。

## 视觉与交互

- 保留现有白色基底、细网格、编辑部式标题、克制圆角与粉红/绿色/蓝色强调色。
- 不使用卡片套卡片；平台详情与发布轨迹通过间距、分隔线和排版层级区分。
- 所有下载、复制、筛选、重试、平台切换和历史抽屉操作支持键盘与可见焦点。
- 默认聚焦当前系统平台，但平台选择在会话内保持用户最后一次选择。
- 系统端适配包括 Windows 桌面窗口、Android 手机、iPhone/iPad 和普通浏览器。

## 验证策略

- 清单契约测试：字段、版本排序、渠道、过期时间、签名状态和资产分类。
- 安装包测试：真实文件、合理最小体积、扩展名、SHA-256 和下载响应。
- UI 测试：平台切换、历史筛选、空状态、失败状态、缓存状态、窄屏和键盘操作。
- Windows CI：构建并验证 EXE。
- Android CI：构建并验证测试签名 APK，确认签名指纹与 GitHub Secrets 中的测试密钥一致；正式 keystore 缺失时禁止标记为稳定签名。
- iOS CI：macOS Runner 上运行 Capacitor 同步与模拟器 `xcodebuild`；配置凭据后增加 Archive、签名和上传验证。
- 发布回归：测试版清理不能删除稳定版本，固定 latest 别名必须指向最新成功产物。

## 分阶段交付

1. 第一阶段：版本中心 UI、统一清单、Capacitor Android/iOS 工程、Electron Windows 工程、Android 测试签名、测试构建、历史记录与 90 天清理。
2. 第二阶段：取得 Android keystore 和 Windows 证书后启用签名与可信更新。
3. 第三阶段：取得 Apple Developer Program 账号后接入 TestFlight，验证通过后再启用 App Store 发布。

## 不在首期范围

- 在没有开发者账号时生成或分发可安装 IPA。
- 在仓库中保存任何签名私钥、证书密码或 App Store Connect 密钥。
- 自动绕过 Windows SmartScreen、Android 未知来源提示或 Apple 审核。
- 建设独立应用商店后端；首期以 GitHub Releases 与站点缓存清单为版本来源。
