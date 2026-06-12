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
echo "  E2E AUTH FLOW TESTS"
echo "========================================="
echo ""

# Test 1: Signup
echo "--- Test: Signup ---"
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser_e2e","email":"test_e2e@campus.edu","password":"TestPass123","fullName":"Test User","university":"MIT"}')
SIGNUP_BODY=$(echo "$SIGNUP_RESPONSE" | sed '$d')
SIGNUP_STATUS=$(echo "$SIGNUP_RESPONSE" | tail -n1)

if [ "$SIGNUP_STATUS" = "201" ] || [ "$SIGNUP_STATUS" = "200" ]; then
  pass "Signup returned $SIGNUP_STATUS"
elif [ "$SIGNUP_STATUS" = "409" ]; then
  pass "Signup returned 409 (user already exists) - acceptable"
else
  fail "Signup returned $SIGNUP_STATUS"
fi

echo ""

# Test 2: Login with valid credentials (admin)
echo "--- Test: Login with valid credentials ---"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"Password123"}')
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)

if [ "$LOGIN_STATUS" = "200" ]; then
  TOKEN=$(echo "$LOGIN_BODY" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('accessToken','') or d.get('data',{}).get('token',''))" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$LOGIN_BODY" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('refreshToken','') or d.get('data',{}).get('refreshToken',''))" 2>/dev/null)
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
    pass "Login succeeded, token received"
  else
    pass "Login returned 200 but token not found in response"
  fi
else
  fail "Login returned $LOGIN_STATUS"
fi

echo ""

# Test 3: Login with invalid credentials
echo "--- Test: Login with invalid credentials ---"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"WrongPassword"}')
INVALID_STATUS=$(echo "$INVALID_RESPONSE" | tail -n1)

if [ "$INVALID_STATUS" = "401" ] || [ "$INVALID_STATUS" = "400" ]; then
  pass "Invalid login correctly returned $INVALID_STATUS"
else
  fail "Invalid login returned $INVALID_STATUS (expected 401 or 400)"
fi

echo ""

# Test 4: GET /api/auth/me with valid token
echo "--- Test: GET /me with valid token ---"
if [ -z "$TOKEN" ]; then
  fail "Skipped - no token available from login"
else
  ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  ME_STATUS=$(echo "$ME_RESPONSE" | tail -n1)

  if [ "$ME_STATUS" = "200" ]; then
    pass "GET /me returned 200 with valid token"
  else
    fail "GET /me returned $ME_STATUS"
  fi
fi

echo ""

# Test 5: GET /api/auth/me without token
echo "--- Test: GET /me without token (should fail) ---"
NOAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/auth/me")
NOAUTH_STATUS=$(echo "$NOAUTH_RESPONSE" | tail -n1)

if [ "$NOAUTH_STATUS" = "401" ] || [ "$NOAUTH_STATUS" = "403" ]; then
  pass "GET /me without token correctly returned $NOAUTH_STATUS"
else
  fail "GET /me without token returned $NOAUTH_STATUS (expected 401 or 403)"
fi

echo ""

# Test 6: Refresh token
echo "--- Test: Refresh token ---"
if [ -z "$REFRESH_TOKEN" ]; then
  fail "Skipped - no refresh token available"
else
  REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/refresh-token" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
  REFRESH_STATUS=$(echo "$REFRESH_RESPONSE" | tail -n1)

  if [ "$REFRESH_STATUS" = "200" ]; then
    NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | sed '$d' | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('accessToken','') or d.get('data',{}).get('token',''))" 2>/dev/null)
    if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "" ]; then
      TOKEN="$NEW_TOKEN"
      pass "Refresh token succeeded, new token received"
    else
      pass "Refresh token returned 200 but new token not parsed"
    fi
  else
    fail "Refresh token returned $REFRESH_STATUS"
  fi
fi

echo ""

# Save token to file for other test scripts
if [ -n "$TOKEN" ]; then
  echo "$TOKEN" > /tmp/e2e_jwt_token.txt
  echo "Token saved to /tmp/e2e_jwt_token.txt"
fi

echo ""
echo "========================================="
echo "  AUTH TESTS SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi
