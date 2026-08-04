#!/bin/bash
# Weekly Traffic Report for rediagram.com
# Queries Supabase page_views table and generates a weekly summary
# Run every Monday morning via cron

set -euo pipefail

# Load Supabase env
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

REPORT_FILE="/root/.openclaw/workspace/memory/traffic-report-$(date -u '+%Y-%m-%d').md"
NOW=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Date ranges (ISO 8601 with timezone)
WEEK_AGO=$(date -u -d '7 days ago' '+%Y-%m-%dT00:00:00+00:00')
TWO_WEEKS_AGO=$(date -u -d '14 days ago' '+%Y-%m-%dT00:00:00+00:00')
TODAY=$(date -u '+%Y-%m-%dT23:59:59+00:00')
YESTERDAY=$(date -u -d '1 day ago' '+%Y-%m-%dT00:00:00+00:00')

# Query helper: returns JSON from Supabase REST API
query_supabase() {
  local select="$1"
  local filter="$2"
  curl -s --max-time 30 \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    "${SUPABASE_URL}/rest/v1/page_views?select=${select}&${filter}"
}

echo "# 📊 rediagram.com 流量周报" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "报告时间: $NOW" >> "$REPORT_FILE"
echo "统计周期: ${WEEK_AGO%%T*} ~ ${TODAY%%T*}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Total page views this week
WEEK_DATA=$(query_supabase "id" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}")
WEEK_COUNT=$(echo "$WEEK_DATA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

# 2. Total page views last week (for comparison)
LAST_WEEK_DATA=$(query_supabase "id" "created_at=gte.${TWO_WEEKS_AGO}&created_at=lt.${WEEK_AGO}")
LAST_WEEK_COUNT=$(echo "$LAST_WEEK_DATA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

# 3. Unique sessions this week
WEEK_SESSIONS=$(query_supabase "session_id" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}")
UNIQUE_SESSIONS=$(echo "$WEEK_SESSIONS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
sessions = set(item.get('session_id','') for item in data if item.get('session_id'))
print(len(sessions))
" 2>/dev/null || echo "0")

# 4. Daily breakdown
DAILY_DATA=$(query_supabase "created_at" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}&order=created_at.asc")

# 5. Top pages
TOP_PAGES=$(query_supabase "path" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}")

# 6. Top referrers
TOP_REFERRERS=$(query_supabase "referrer" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}&referrer=not.is.null")

# 7. Top countries
TOP_COUNTRIES=$(query_supabase "country" "created_at=gte.${WEEK_AGO}&created_at=lte.${TODAY}&country=not.is.null")

# Calculate week-over-week change
if [ "$LAST_WEEK_COUNT" -gt 0 ]; then
  WOW_CHANGE=$(python3 -c "print(round(($WEEK_COUNT - $LAST_WEEK_COUNT) / $LAST_WEEK_COUNT * 100, 1))" 2>/dev/null || echo "0")
else
  WOW_CHANGE="N/A"
fi

# Build daily breakdown
DAILY_BREAKDOWN=$(echo "$DAILY_DATA" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
daily = Counter()
for item in data:
    date = item.get('created_at','')[:10]
    daily[date] += 1
for date in sorted(daily.keys()):
    print(f'  {date}: {daily[date]} 次访问')
" 2>/dev/null || echo "  数据解析失败")

# Top pages breakdown
PAGES_BREAKDOWN=$(echo "$TOP_PAGES" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
pages = Counter(item.get('path','/') for item in data)
for path, count in pages.most_common(10):
    print(f'  {path}: {count} 次')
" 2>/dev/null || echo "  数据解析失败")

# Top referrers breakdown
REFERRERS_BREAKDOWN=$(echo "$TOP_REFERRERS" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
refs = Counter(item.get('referrer','') for item in data if item.get('referrer'))
for ref, count in refs.most_common(10):
    print(f'  {ref}: {count} 次')
" 2>/dev/null || echo "  无来源数据")

# Top countries breakdown
COUNTRIES_BREAKDOWN=$(echo "$TOP_COUNTRIES" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
countries = Counter(item.get('country','Unknown') for item in data if item.get('country'))
for country, count in countries.most_common(10):
    print(f'  {country}: {count} 次')
" 2>/dev/null || echo "  无地区数据")

# Write report
{
  echo "## 本周概览"
  echo ""
  echo "- 总访问量 (PV): **$WEEK_COUNT**"
  echo "- 独立访客 (UV): **$UNIQUE_SESSIONS**"
  echo "- 上周访问量: **$LAST_WEEK_COUNT**"
  echo "- 周环比变化: **${WOW_CHANGE}%**"
  echo ""
  echo "## 每日访问明细"
  echo ""
  echo '```'
  echo "$DAILY_BREAKDOWN"
  echo '```'
  echo ""
  echo "## 热门页面 Top 10"
  echo ""
  echo '```'
  echo "$PAGES_BREAKDOWN"
  echo '```'
  echo ""
  echo "## 流量来源 Top 10"
  echo ""
  echo '```'
  echo "$REFERRERS_BREAKDOWN"
  echo '```'
  echo ""
  echo "## 访客地区 Top 10"
  echo ""
  echo '```'
  echo "$COUNTRIES_BREAKDOWN"
  echo '```'
  echo ""
  echo "---"
  echo "数据来源: 自建追踪 (Supabase page_views)"
} >> "$REPORT_FILE"

cat "$REPORT_FILE"
