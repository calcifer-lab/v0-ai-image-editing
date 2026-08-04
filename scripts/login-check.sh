#!/bin/bash
# Login Health Check Script for rediagram.com
# Checks: site accessibility, login page, Supabase auth, OAuth buttons
# Run every 5 days via cron

set -euo pipefail

SITE_URL="https://www.rediagram.com"
LOGIN_URL="https://www.rediagram.com/login"
HEALTH_URL="https://www.rediagram.com/api/health"
REPORT_FILE="/root/.openclaw/workspace/memory/login-check-report.txt"

ERRORS=()
WARNINGS=()
INFO=()

echo "=== Login Health Check: $(date -u '+%Y-%m-%d %H:%M:%S UTC') ===" > "$REPORT_FILE"

# 1. Check site root
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$SITE_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  INFO+=("✅ 站点首页正常 (HTTP $HTTP_CODE)")
else
  ERRORS+=("❌ 站点首页异常 (HTTP $HTTP_CODE)")
fi

# 2. Check health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$HEALTH_URL" 2>/dev/null || echo "000")
HEALTH_BODY=$(curl -s --max-time 15 "$HEALTH_URL" 2>/dev/null || echo "{}")
if [ "$HTTP_CODE" = "200" ]; then
  INFO+=("✅ 健康检查接口正常 (HTTP $HTTP_CODE) - $HEALTH_BODY")
else
  ERRORS+=("❌ 健康检查接口异常 (HTTP $HTTP_CODE)")
fi

# 3. Check login page loads
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$LOGIN_URL" 2>/dev/null || echo "000")
LOGIN_HTML=$(curl -s --max-time 15 "$LOGIN_URL" 2>/dev/null || echo "")
if [ "$HTTP_CODE" = "200" ]; then
  INFO+=("✅ 登录页面可访问 (HTTP $HTTP_CODE)")
else
  ERRORS+=("❌ 登录页面无法访问 (HTTP $HTTP_CODE)")
fi

# 4. Check OAuth buttons present in login page HTML
if echo "$LOGIN_HTML" | grep -qi "google"; then
  INFO+=("✅ Google OAuth 按钮存在")
else
  WARNINGS+=("⚠️ 未在登录页检测到 Google OAuth 按钮")
fi

if echo "$LOGIN_HTML" | grep -qi "github"; then
  INFO+=("✅ GitHub OAuth 按钮存在")
else
  WARNINGS+=("⚠️ 未在登录页检测到 GitHub OAuth 按钮")
fi

# 5. Check Supabase env configured (look for supabase client in page source)
if echo "$LOGIN_HTML" | grep -qi "supabase\|NEXT_PUBLIC_SUPABASE"; then
  INFO+=("✅ Supabase 客户端已加载")
else
  # Check if login page has a "not configured" error
  if echo "$LOGIN_HTML" | grep -qi "not configured\|未配置"; then
    ERRORS+=("❌ Supabase 环境变量未配置，登录功能不可用")
  else
    WARNINGS+=("⚠️ 无法确认 Supabase 客户端状态")
  fi
fi

# 6. Check Supabase auth endpoint directly (if URL is in env)
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" /root/.openclaw/workspace/v0-ai-image-editing/.env.local 2>/dev/null | cut -d'=' -f2 || echo "")
if [ -n "$SUPABASE_URL" ]; then
  AUTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${SUPABASE_URL}/auth/v1/health" 2>/dev/null || echo "000")
  if [ "$AUTH_HTTP" = "200" ]; then
    INFO+=("✅ Supabase Auth 服务正常 (HTTP $AUTH_HTTP)")
  else
    ERRORS+=("❌ Supabase Auth 服务异常 (HTTP $AUTH_HTTP)")
  fi
else
  WARNINGS+=("⚠️ 未找到本地 Supabase URL 配置，跳过 Auth 服务直连检查")
fi

# Write report
{
  echo ""
  echo "--- 检查结果 ---"
  echo ""
  echo "[信息]"
  for item in "${INFO[@]}"; do echo "  $item"; done
  echo ""
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo "[警告]"
    for item in "${WARNINGS[@]}"; do echo "  $item"; done
    echo ""
  fi
  if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "[错误]"
    for item in "${ERRORS[@]}"; do echo "  $item"; done
    echo ""
    echo "🔴 登录检查未通过，需要处理！"
  else
    echo "🟢 登录检查全部通过"
  fi
  echo ""
  echo "=== End of Report ==="
} >> "$REPORT_FILE"

cat "$REPORT_FILE"
