#!/bin/bash
# 保証進捗ダッシュボード - デプロイスクリプト
# URLを固定したまま更新デプロイする

DEPLOYMENT_ID="AKfycbwUm1j9dqJpDy-1eJ62gP8IRJ-81BG6Cn2M59M3ptCO2V_6P3ObOBx6XsJLeHY-hgWy"
WEB_APP_URL="https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"

echo "📤 ファイルをpush中..."
clasp push --force

echo "🚀 デプロイ中（URL固定）..."
clasp deploy --deploymentId "$DEPLOYMENT_ID" --description "$(date '+%Y-%m-%d %H:%M')"

echo ""
echo "✅ デプロイ完了！"
echo "🔗 Web App URL: $WEB_APP_URL"
