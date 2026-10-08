@echo off
REM 本地开发服务器启动脚本
REM 使用方法: 双击运行或在命令行执行 start-dev.bat

echo ========================================
echo 澄见 - 学校数据管理系统
echo 本地开发环境启动脚本
echo ========================================
echo.

REM 检查 .dev.vars 是否存在
if not exist .dev.vars (
    echo [错误] 缺少 .dev.vars 配置文件
    echo 请先创建 .dev.vars 文件并配置 APP_SESSION_SECRET
    echo 参考 docs/LOCAL_DEVELOPMENT.md 获取详细说明
    pause
    exit /b 1
)

REM 检查 dist 目录是否存在
if not exist dist (
    echo [提示] 首次启动，需要先构建项目...
    echo.
    call npm run build
    if errorlevel 1 (
        echo [错误] 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo.
)

echo [启动] 正在启动 Wrangler 开发服务器...
echo [地址] http://localhost:8787
echo [提示] 按 Ctrl+C 停止服务器
echo.

npx wrangler dev --local --port 8787

if errorlevel 1 (
    echo.
    echo [错误] 服务器启动失败
    pause
)
