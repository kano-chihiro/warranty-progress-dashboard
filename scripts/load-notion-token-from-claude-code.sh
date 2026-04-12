#!/usr/bin/env bash
# Claude Code の settings.json に書いてある NOTION_API_TOKEN を、
# この Cursor / ターミナル用のシェルに export する。
#
# 使い方（カレントをプロジェクトルートに）:
#   source ./scripts/load-notion-token-from-claude-code.sh
#
# 別の場所の settings.json を使う場合:
#   export CLAUDE_CODE_SETTINGS_JSON="/path/to/settings.json"
#   source ./scripts/load-notion-token-from-claude-code.sh

set -euo pipefail

CLAUDE_SETTINGS="${CLAUDE_CODE_SETTINGS_JSON:-$HOME/Desktop/Claude×Noesis KAi/Claude Code/settings.json}"

if [[ ! -f "$CLAUDE_SETTINGS" ]]; then
  echo "load-notion-token: ファイルが見つかりません: $CLAUDE_SETTINGS" >&2
  return 1 2>/dev/null || exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "load-notion-token: jq が必要です (brew install jq)" >&2
  return 1 2>/dev/null || exit 1
fi

export NOTION_API_TOKEN
NOTION_API_TOKEN="$(jq -r '.env.NOTION_API_TOKEN // empty' "$CLAUDE_SETTINGS")"

if [[ -z "$NOTION_API_TOKEN" ]]; then
  echo "load-notion-token: .env.NOTION_API_TOKEN が空です: $CLAUDE_SETTINGS" >&2
  return 1 2>/dev/null || exit 1
fi

echo "load-notion-token: NOTION_API_TOKEN を読み込みました (${#NOTION_API_TOKEN} 文字)"
