#!/usr/bin/env bash
# Live route smoke test against dockerized backend on :3000
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:3000}"
API="$BASE/api/v1"
COOKIE_JAR="$(mktemp)"
REPORT="$(mktemp)"
EMAIL="route.test.$(date +%s)@example.com"
PASS='TestPassw0rd!234'
PHONE='+15550001122'
FAIL=0
PASS_N=0

cleanup() { rm -f "$COOKIE_JAR" "$REPORT"; }
trap cleanup EXIT

log() { printf '%s\n' "$*" | tee -a "$REPORT"; }

assert_code() {
  local name="$1" expected="$2" got="$3" body="$4"
  if [[ "$got" == "$expected" ]]; then
    log "OK  [$got] $name"
    PASS_N=$((PASS_N + 1))
  else
    log "FAIL [$got!=$expected] $name :: ${body:0:240}"
    FAIL=$((FAIL + 1))
  fi
}

req() {
  local method="$1" path="$2" expected="$3" name="$4"
  shift 4
  local body_file
  body_file="$(mktemp)"
  local code
  code=$(curl -sS -o "$body_file" -w '%{http_code}' -X "$method" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    ${ACCESS:+-H "Authorization: Bearer $ACCESS"} \
    "$@" \
    "$path" || echo 000)
  local body
  body="$(cat "$body_file")"
  rm -f "$body_file"
  LAST_BODY="$body"
  assert_code "$name" "$expected" "$code" "$body"
}

extract() {
  python3 - "$1" <<'PY'
import json,sys
path=sys.argv[1].split('.')
raw=sys.stdin.read()
try:
  data=json.loads(raw)
except Exception:
  print(''); sys.exit(0)
cur=data
for p in path:
  if isinstance(cur, dict) and p in cur:
    cur=cur[p]
  else:
    print(''); sys.exit(0)
print(cur if cur is not None else '')
PY
}

log "=== System ==="
req GET "$BASE/health" 200 "GET /health"
req GET "$BASE/health/live" 200 "GET /health/live"
req GET "$BASE/health/ready" 200 "GET /health/ready"
req GET "$BASE/csrf-token" 200 "GET /csrf-token"
code=$(curl -sS -o /tmp/m.out -w '%{http_code}' "$BASE/metrics" || echo 000)
assert_code "GET /metrics without auth" 401 "$code" "$(cat /tmp/m.out)"
# Local compose defaults (override with METRICS_BASIC_AUTH=user:pass).
METRICS_BASIC_AUTH="${METRICS_BASIC_AUTH:-admin:admin}"
code=$(curl -sS -o /tmp/m.out -w '%{http_code}' -u "$METRICS_BASIC_AUTH" "$BASE/metrics" || echo 000)
assert_code "GET /metrics with basic auth" 200 "$code" "$(head -c 80 /tmp/m.out)"
req POST "$BASE/security/csp-violation" 204 "POST /security/csp-violation" \
  -H 'Content-Type: application/csp-report' \
  --data '{"csp-report":{"blocked-uri":"https://evil.example","violated-directive":"script-src"}}'

log "=== Auth signup/verify/login ==="
req POST "$API/auth/signup" 201 "POST /auth/signup" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"firstName\":\"Route\",\"lastName\":\"Tester\",\"phone\":\"$PHONE\"}"

# Wait for MailHog OTP
OTP=""
for i in $(seq 1 20); do
  sleep 1
  curl -sS http://127.0.0.1:8025/api/v2/messages > /tmp/mailhog.json || true
  OTP=$(EMAIL="$EMAIL" python3 - <<'PY'
import json,re,os
email=os.environ['EMAIL'].lower()
try:
  msgs=json.load(open('/tmp/mailhog.json')).get('items',[])
except Exception:
  msgs=[]
for m in msgs:
  tos=' '.join(str(x) for x in (m.get('To') or [])).lower()
  headers=str((m.get('Content') or {}).get('Headers') or {}).lower()
  if email not in tos and email not in headers:
    continue
  body=(m.get('Content',{}) or {}).get('Body') or ''
  for part in ((m.get('MIME') or {}).get('Parts') or []):
    body += part.get('Body') or ''
  hit=re.search(r'\b(\d{4,8})\b', body)
  if hit:
    print(hit.group(1)); break
PY
)
  [[ -n "$OTP" ]] && break
done
if [[ -z "$OTP" ]]; then
  log "FAIL could not read OTP from MailHog"
  FAIL=$((FAIL + 1))
else
  log "OK  OTP from MailHog: $OTP"
  PASS_N=$((PASS_N + 1))
fi

req POST "$API/auth/verify" 200 "POST /auth/verify" \
  --data "{\"email\":\"$EMAIL\",\"otp\":\"$OTP\"}"

# Capture access token from header
HDRS=$(mktemp)
curl -sS -D "$HDRS" -o /tmp/login.json -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -X POST "$API/auth/login" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null
code=$(awk 'NR==1{print $2}' "$HDRS")
ACCESS=$(grep -i '^authorization:' "$HDRS" | sed 's/[Aa]uthorization: *Bearer *//;s/\r//')
assert_code "POST /auth/login" 200 "$code" "$(head -c 200 /tmp/login.json)"
[[ -n "$ACCESS" ]] && { log "OK  access token present"; PASS_N=$((PASS_N+1)); } || { log "FAIL no access token"; FAIL=$((FAIL+1)); }

req GET "$API/auth/me" 200 "GET /auth/me"
req GET "$API/auth/sessions" 200 "GET /auth/sessions"
req POST "$API/auth/refresh" 200 "POST /auth/refresh"
# refresh rotates access
ACCESS=$(curl -sS -D - -o /tmp/ref.json -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$API/auth/refresh" 2>/dev/null | grep -i '^authorization:' | sed 's/[Aa]uthorization: *Bearer *//;s/\r//')

log "=== TOTP enroll + recovery ==="
req POST "$API/auth/totp/enroll" 200 "POST /auth/totp/enroll"
SECRET=$(printf '%s' "$LAST_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(((d.get('data') or {}).get('secret') or ''))")
if [[ -z "$SECRET" ]]; then
  log "FAIL empty TOTP secret from enroll: ${LAST_BODY:0:300}"
  FAIL=$((FAIL + 1))
else
  log "OK  TOTP secret received"
  PASS_N=$((PASS_N + 1))
fi
TOTP=$(node -e "const {generateSync}=require('otplib'); console.log(generateSync({secret: process.argv[1]}));" "$SECRET" 2>/dev/null || true)
if [[ -z "$TOTP" ]]; then
  log "FAIL could not generate TOTP code for secret=$SECRET"
  FAIL=$((FAIL + 1))
else
  log "OK  generated TOTP code"
  PASS_N=$((PASS_N + 1))
fi
req POST "$API/auth/totp/confirm" 200 "POST /auth/totp/confirm" \
  --data "{\"totpCode\":\"$TOTP\"}"
req POST "$API/auth/totp/recovery-codes" 200 "POST /auth/totp/recovery-codes"
RECOVERY=$(printf '%s' "$LAST_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); codes=((d.get('data') or {}).get('codes') or []); print(codes[0] if codes else '')")

code=$(curl -sS -o /tmp/login2.json -w '%{http_code}' -H 'Content-Type: application/json' \
  -X POST "$API/auth/login" --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" || echo 000)
if [[ "$code" != "200" ]]; then
  log "OK  [$code] POST /auth/login without totpCode rejected"
  PASS_N=$((PASS_N + 1))
else
  log "FAIL [200] login without totpCode should fail"
  FAIL=$((FAIL + 1))
fi

# Recover with recovery code
HDRS=$(mktemp)
curl -sS -D "$HDRS" -o /tmp/recover.json -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -X POST "$API/auth/totp/recover" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"recoveryCode\":\"$RECOVERY\"}" >/dev/null
code=$(awk 'NR==1{print $2}' "$HDRS")
ACCESS=$(grep -i '^authorization:' "$HDRS" | sed 's/[Aa]uthorization: *Bearer *//;s/\r//')
assert_code "POST /auth/totp/recover" 200 "$code" "$(head -c 200 /tmp/recover.json)"

log "=== Users self-service ==="
req PUT "$API/users/profile" 200 "PUT /users/profile" \
  --data '{"firstName":"Route2","lastName":"Tester2","phone":"+15550001123"}'
USER_ID=$(printf '%s' "$LAST_BODY" | extract data.id)
[[ -z "$USER_ID" ]] && USER_ID=$(printf '%s' "$(cat /tmp/login.json)" | extract data.id)

log "=== Blogs ==="
req GET "$API/blogs" 200 "GET /blogs"
req GET "$API/blogs/search?q=hello" 200 "GET /blogs/search"
code=$(curl -sS -o /tmp/blog.json -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -X POST "$API/blogs" \
  --data '{"title":"Smoke Post","content":"Hello from smoke test","excerpt":"hi"}' || echo 000)
if [[ "$code" == "201" || "$code" == "403" ]]; then
  log "OK  [$code] POST /blogs"
  PASS_N=$((PASS_N + 1))
else
  log "FAIL [$code] POST /blogs :: $(head -c 200 /tmp/blog.json)"
  FAIL=$((FAIL + 1))
fi

log "=== Files ==="
code=$(curl -sS -o /tmp/presign.json -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -X POST "$API/files/presign" \
  --data '{"filename":"smoke.png","contentType":"image/png","size":128}' || echo 000)
if [[ "$code" == "200" || "$code" == "201" ]]; then
  log "OK  [$code] POST /files/presign"
  PASS_N=$((PASS_N + 1))
else
  log "FAIL [$code] POST /files/presign :: $(head -c 200 /tmp/presign.json)"
  FAIL=$((FAIL + 1))
fi

log "=== OAuth accounts list ==="
req GET "$API/auth/oauth/accounts" 200 "GET /auth/oauth/accounts"

log "=== Logout ==="
req POST "$API/auth/logout" 200 "POST /auth/logout"

log ""
log "=== SUMMARY pass=$PASS_N fail=$FAIL ==="
[[ "$FAIL" -eq 0 ]]
