#!/bin/bash
# 本地开发服务器启动脚本
# 使用方法: chmod +x start-dev.sh && ./start-dev.sh

echo "========================================"
echo "澄见 - 学校数据管理系统"
echo "本地开发环境启动脚本"
echo "========================================"
echo ""

# 检查 .dev.vars 是否存在
if [ ! -f .dev.vars ]; then
    echo "[错误] 缺少 .dev.vars 配置文件"
    echo "请先创建 .dev.vars 文件并配置 APP_SESSION_SECRET"
    echo "参考 docs/LOCAL_DEVELOPMENT.md 获取详细说明"
    exit 1
fi

# 检查 dist 目录是否存在
if [ ! -d dist ]; then
    echo "[提示] 首次启动，需要先构建项目..."
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo "[错误] 构建失败，请检查错误信息"
        exit 1
    fi
    echo ""
fi

echo "[启动] 正在启动 Wrangler 开发服务器..."
echo "[地址] http://localhost:8787"
echo "[提示] 按 Ctrl+C 停止服务器"
echo ""

npx wrangler dev --local --port 8787

if [ $? -ne 0 ]; then
    echo ""
    echo "[错误] 服务器启动失败"
    exit 1
fi
