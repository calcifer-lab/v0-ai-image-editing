#!/bin/bash
# Daily traffic anomaly detector for rediagram.com
# Checks if today's traffic is abnormally high or low compared to 7-day average
# Run daily via cron, alerts if anomaly detected

set -euo pipefail

ENV_FILE="/root/.openclaw/workspace/v0-ai-image-editing/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/root/.openclaw/workspace/v0-ai-image-editing/.env"
fi

source "$ENV_FILE" 2>/dev/null || true

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "ERROR: Supabase env not configured"
  exit 1
fi

# Time ranges
TODAY_START=$(date -u -d 'today' '+%Y-%m-%dT00:00:00+00:00')
TODAY_END=$(date -u '+%Y-%m-%dT23:59:59+00:00')
WEEK_AGO_START=$(date -u -d '7 days ago' '+%Y-%m-%dT00:00:00+00:00')
YESTERDAY_START=$(date -u -d '1 day ago' '+%Y-%m-%dT00:00:00+00:00')

# Get today's count
TODAY_DATA=$(curl -s --max-time 30 \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "${SUPABASE_URL}/rest/v1/page_views?select=id&created_at=gte.${TODAY_START}&created_at=lte.${TODAY_END}")

TODAY_COUNT=$(echo "$TODAY_DATA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

# Get last 7 days count (excluding today) for average
WEEK_DATA=$(curl -s --max-time 30 \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "${SUPABASE_URL}/rest/v1/page_views?select=id&created_at=gte.${WEEK_AGO_START}&created_at=lt.${TODAY_START}")

WEEK_COUNT=$(echo "$WEEK_DATA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

# Calculate daily average
DAILY_AVG=$(python3 -c "
avg = $WEEK_COUNT / 7 if $WEEK_COUNT > 0 else 0
print(round(avg, 1))
" 2>/dev/null || echo "0")

# Anomaly detection thresholds
# Alert if today's traffic is 3x the daily average (sudden spike)
# Alert if today's traffic is 0 but average > 5 (possible outage)
SPIKE_THRESHOLD=$(python3 -c "print(int($DAILY_AVG * 3))" 2>/dev/null || echo "0")

ALERT_TRIGGERED=false
ALERT_MSG=""

if [ "$DAILY_AVG" -gt 5 ] && [ "$TODAY_COUNT" -ge "$SPIKE_THRESHOLD" ] && [ "$SPIKE_THRESHOLD" -gt 0 ]; then
  ALERT_TRIGGERED=true
  ALERT_MSG="🔥 流量异常飙升！今日访问 ${TODAY_COUNT} 次，日均仅 ${DAILY_AVG} 次（${SPIKE_THRESHOLD} 为阈值）"
fi

if [ "$DAILY_AVG" -gt 5 ] && [ "$TODAY_COUNT" -eq 0 ]; then
  ALERT_TRIGGERED=true
  ALERT_MSG="⚠️ 流量异常归零！今日无访问记录，日均 ${DAILY_AVG} 次，可能存在服务故障"
fi

# Output result
if [ "$ALERT_TRIGGERED" = true ]; then
  echo "ALERT: $ALERT_MSG"
  echo "DATE: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "TODAY_COUNT: $TODAY_COUNT"
  echo "DAILY_AVG: $DAILY_AVG"
  echo "WEEK_COUNT: $WEEK_COUNT"
  exit 2  # Exit code 2 = alert triggered
else
  echo "OK: 今日访问 ${TODAY_COUNT} 次，日均 ${DAILY_AVG} 次，无异常"
  exit 0
fi
