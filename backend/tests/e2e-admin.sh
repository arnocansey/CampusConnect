#!/bin/bash

BASE_URL="http://localhost:5000"

PASS_COUNT=0
FAIL_COUNT=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() {
  echo -e "${GREEN}PASS${NC}: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "${RED}FAIL${NC}: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

echo "========================================="
echo "  E2E ADMIN PANEL TESTS"
echo "========================================="
echo ""

# Login as admin
echo "--- Admin Login ---"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"Password123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('accessToken','') or d.get('data',{}).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}ERROR${NC}: Could not login as admin. Aborting."
  exit 1
fi
echo -e "${GREEN}PASS${NC}: Admin login succeeded"
PASS_COUNT=$((PASS_COUNT + 1))
echo ""

# Test 1: Dashboard stats
echo "--- Test: Dashboard stats ---"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/stats" \
  -H "Authorization: Bearer $TOKEN")
STATS_STATUS=$(echo "$STATS_RESPONSE" | tail -n1)

if [ "$STATS_STATUS" = "200" ]; then
  pass "Dashboard stats returned 200"
else
  fail "Dashboard stats returned $STATS_STATUS"
fi

echo ""

# Test 2: List users
echo "--- Test: List users ---"
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/users" \
  -H "Authorization: Bearer $TOKEN")
USERS_STATUS=$(echo "$USERS_RESPONSE" | tail -n1)

if [ "$USERS_STATUS" = "200" ]; then
  pass "List users returned 200"
else
  fail "List users returned $USERS_STATUS"
fi

echo ""

# Test 3: List universities
echo "--- Test: List universities ---"
UNI_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/universities" \
  -H "Authorization: Bearer $TOKEN")
UNI_STATUS=$(echo "$UNI_RESPONSE" | tail -n1)

if [ "$UNI_STATUS" = "200" ]; then
  pass "List universities returned 200"
else
  fail "List universities returned $UNI_STATUS"
fi

echo ""

# Test 4: List marketplace items (admin)
echo "--- Test: List marketplace items (admin) ---"
MKT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/marketplace" \
  -H "Authorization: Bearer $TOKEN")
MKT_STATUS=$(echo "$MKT_RESPONSE" | tail -n1)

if [ "$MKT_STATUS" = "200" ]; then
  pass "Admin marketplace list returned 200"
else
  fail "Admin marketplace list returned $MKT_STATUS"
fi

echo ""

# Test 5: Get system settings
echo "--- Test: Get system settings ---"
SETTINGS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/settings" \
  -H "Authorization: Bearer $TOKEN")
SETTINGS_STATUS=$(echo "$SETTINGS_RESPONSE" | tail -n1)

if [ "$SETTINGS_STATUS" = "200" ]; then
  pass "System settings returned 200"
else
  fail "System settings returned $SETTINGS_STATUS"
fi

echo ""

# Test 6: Audit log
echo "--- Test: Audit log ---"
AUDIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/audit" \
  -H "Authorization: Bearer $TOKEN")
AUDIT_STATUS=$(echo "$AUDIT_RESPONSE" | tail -n1)

if [ "$AUDIT_STATUS" = "200" ]; then
  pass "Audit log returned 200"
else
  fail "Audit log returned $AUDIT_STATUS"
fi

echo ""

# Test 7: Admin access without token (should fail)
echo "--- Test: Admin access without token (should fail) ---"
NOAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/stats")
NOAUTH_STATUS=$(echo "$NOAUTH_RESPONSE" | tail -n1)

if [ "$NOAUTH_STATUS" = "401" ] || [ "$NOAUTH_STATUS" = "403" ]; then
  pass "Admin access without token correctly returned $NOAUTH_STATUS"
else
  fail "Admin access without token returned $NOAUTH_STATUS (expected 401 or 403)"
fi

echo ""
echo "========================================="
echo "  ADMIN PANEL TESTS SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi
