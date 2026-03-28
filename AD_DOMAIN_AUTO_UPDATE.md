# AD 域控无人值守更新方案

这套方案适合当前 `school-system` 的本地客户端交付：

- 服务器上放一个共享目录
- 每次发版时把最新 `lt.html` 单文件包推到共享目录
- 通过 AD 组策略下发“计算机启动脚本”
- 客户机每次重启后自动检查版本并同步
- 不需要逐台跑现场

## 方案结构

默认共享目录建议类似：

```text
\\DC01\SchoolSystemDeploy$\
  current\
    lt.html
    favicon.ico
    Open School System.cmd
    release.json
    public\assets\vendor\tabler-icons\...
  releases\
    20260328-230000-abcd123\
      package\...
  scripts\
    ad-client-startup-update.ps1
```

客户端默认同步到：

```text
C:\ProgramData\SchoolSystem\
  app\
  logs\
```

## 已提供脚本

- 服务端发版脚本: [scripts/publish-ad-release.ps1](C:/Users/loru/Desktop/system/scripts/publish-ad-release.ps1)
- 客户端开机更新脚本: [scripts/ad-client-startup-update.ps1](C:/Users/loru/Desktop/system/scripts/ad-client-startup-update.ps1)

## 一次性准备

1. 在域控或文件服务器建立共享目录，例如 `\\DC01\SchoolSystemDeploy$`
2. 共享权限建议：
   - `Domain Computers`: 读取
   - 运维/域管理员: 修改
3. 客户机需能在开机时访问该共享目录

## 发布新版本

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-ad-release.ps1 `
  -ShareRoot "\\DC01\SchoolSystemDeploy$"
```

可选参数：

```powershell
-Version "2026.03.28-r1"
-Channel "production"
-SkipBuild
```

脚本会做这些事：

- 如未指定 `-SkipBuild`，先执行 `npm run build`
- 取当前 `lt.html`
- 一并打包 `favicon.ico` 和 `tabler-icons`
- 生成 `release.json`
- 生成启动文件 `Open School System.cmd`
- 更新共享目录下的 `current`
- 保留一份版本归档到 `releases\<version>`

## 在 AD 里配置自动更新

推荐用“计算机启动 PowerShell 脚本”。

组策略位置：

`计算机配置 -> Windows 设置 -> 脚本(启动/关机) -> 启动`

脚本可填写：

```text
\\DC01\SchoolSystemDeploy$\scripts\ad-client-startup-update.ps1
```

参数填写：

```text
-ShareRoot \\DC01\SchoolSystemDeploy$
```

如果你想改本地安装目录：

```text
-ShareRoot \\DC01\SchoolSystemDeploy$ -LocalRoot C:\ProgramData\SchoolSystem
```

## 客户机重启后的行为

启动脚本会：

1. 等待共享目录可访问
2. 读取 `\\...\current\release.json`
3. 与本地版本比较
4. 如版本不同，使用 `robocopy /MIR` 同步到 `C:\ProgramData\SchoolSystem\app`
5. 自动更新公用桌面快捷方式 `School System.lnk`
6. 写日志到：

```text
C:\ProgramData\SchoolSystem\logs\startup-update.log
```

## 日常发版流程

以后每次发版只要重复这一步：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-ad-release.ps1 `
  -ShareRoot "\\DC01\SchoolSystemDeploy$"
```

然后让客户机重启即可自动更新，不需要再逐台处理。

## 适合当前项目的原因

当前仓库已经稳定生成 [lt.html](C:/Users/loru/Desktop/system/lt.html)，它非常适合 AD 分发：

- 文件数量少
- 客户机无须安装 Node
- 不依赖本地 Web 服务
- 重启后只做文件同步，稳定性高

## 验证建议

发版后建议先找 1 台域内测试机验证：

1. 执行发布脚本
2. 重启测试机
3. 检查本地目录是否更新
4. 打开桌面快捷方式
5. 登录验证核心模块

## 备注

如果后续你想升级成：

- 开机自动拉起浏览器
- 指定 Edge/Chrome 全屏模式
- 分校区分组灰度发布
- 只对某个 OU 自动更新

可以继续在这套脚本上扩展，不需要推倒重来。
