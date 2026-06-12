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

# Load token
if [ -f /tmp/e2e_jwt_token.txt ]; then
  TOKEN=$(cat /tmp/e2e_jwt_token.txt)
else
  echo "No token found. Run e2e-auth.sh first or logging in..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@campus.edu","password":"Password123"}')
  TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('accessToken','') or d.get('data',{}).get('token',''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}ERROR${NC}: Could not obtain auth token. Aborting."
  exit 1
fi

echo "========================================="
echo "  E2E POST LIFECYCLE TESTS"
echo "========================================="
echo ""

POST_ID=""

# Test 1: Create a post
echo "--- Test: Create post ---"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"E2E test post - automated testing","tags":["testing","e2e"]}')
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -n1)

if [ "$CREATE_STATUS" = "201" ] || [ "$CREATE_STATUS" = "200" ]; then
  POST_ID=$(echo "$CREATE_BODY" | python -c "import sys,json; d=json.load(sys.stdin); p=d.get('data',{}).get('post') or d.get('post') or d.get('data',{}); print(p.get('id','') or p.get('_id',''))" 2>/dev/null)
  if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
    pass "Create post returned $CREATE_STATUS, ID: $POST_ID"
  else
    pass "Create post returned $CREATE_STATUS (ID not parsed)"
  fi
else
  fail "Create post returned $CREATE_STATUS"
fi

echo ""

# Test 2: Get feed
echo "--- Test: Get feed ---"
FEED_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/posts/feed" \
  -H "Authorization: Bearer $TOKEN")
FEED_STATUS=$(echo "$FEED_RESPONSE" | tail -n1)

if [ "$FEED_STATUS" = "200" ]; then
  pass "Get feed returned 200"
else
  fail "Get feed returned $FEED_STATUS"
fi

echo ""

# Test 3: Get post by ID
echo "--- Test: Get post by ID ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  GET_POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/posts/$POST_ID" \
    -H "Authorization: Bearer $TOKEN")
  GET_POST_STATUS=$(echo "$GET_POST_RESPONSE" | tail -n1)

  if [ "$GET_POST_STATUS" = "200" ]; then
    pass "Get post by ID returned 200"
  else
    fail "Get post by ID returned $GET_POST_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""

# Test 4: Like post
echo "--- Test: Like post ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  LIKE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts/$POST_ID/like" \
    -H "Authorization: Bearer $TOKEN")
  LIKE_STATUS=$(echo "$LIKE_RESPONSE" | tail -n1)

  if [ "$LIKE_STATUS" = "200" ] || [ "$LIKE_STATUS" = "201" ]; then
    pass "Like post returned $LIKE_STATUS"
  else
    fail "Like post returned $LIKE_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""

# Test 5: Unlike post (toggle)
echo "--- Test: Unlike post (toggle) ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  UNLIKE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts/$POST_ID/like" \
    -H "Authorization: Bearer $TOKEN")
  UNLIKE_STATUS=$(echo "$UNLIKE_RESPONSE" | tail -n1)

  if [ "$UNLIKE_STATUS" = "200" ]; then
    pass "Unlike post (toggle) returned 200"
  else
    fail "Unlike post (toggle) returned $UNLIKE_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""

# Test 6: Save post
echo "--- Test: Save post ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  SAVE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts/$POST_ID/save" \
    -H "Authorization: Bearer $TOKEN")
  SAVE_STATUS=$(echo "$SAVE_RESPONSE" | tail -n1)

  if [ "$SAVE_STATUS" = "200" ] || [ "$SAVE_STATUS" = "201" ]; then
    pass "Save post returned $SAVE_STATUS"
  else
    fail "Save post returned $SAVE_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""

# Test 7: Unsave post (toggle)
echo "--- Test: Unsave post (toggle) ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  UNSAVE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts/$POST_ID/save" \
    -H "Authorization: Bearer $TOKEN")
  UNSAVE_STATUS=$(echo "$UNSAVE_RESPONSE" | tail -n1)

  if [ "$UNSAVE_STATUS" = "200" ]; then
    pass "Unsave post (toggle) returned 200"
  else
    fail "Unsave post (toggle) returned $UNSAVE_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""

# Test 8: Get trending
echo "--- Test: Get trending ---"
TRENDING_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/posts/trending" \
  -H "Authorization: Bearer $TOKEN")
TRENDING_STATUS=$(echo "$TRENDING_RESPONSE" | tail -n1)

if [ "$TRENDING_STATUS" = "200" ]; then
  pass "Get trending returned 200"
else
  fail "Get trending returned $TRENDING_STATUS"
fi

echo ""

# Test 9: Create comment
echo "--- Test: Create comment ---"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "" ]; then
  COMMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/posts/$POST_ID/comments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"content":"E2E test comment - automated testing"}')
  COMMENT_STATUS=$(echo "$COMMENT_RESPONSE" | tail -n1)

  if [ "$COMMENT_STATUS" = "201" ] || [ "$COMMENT_STATUS" = "200" ]; then
    pass "Create comment returned $COMMENT_STATUS"
  else
    fail "Create comment returned $COMMENT_STATUS"
  fi
else
  fail "Skipped - no post ID available"
fi

echo ""
echo "========================================="
echo "  POST LIFECYCLE TESTS SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi
