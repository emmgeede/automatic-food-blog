#!/bin/bash

# Test Script - kopiere diesen Inhalt auf den Server

# Hole Umgebungsvariablen
SECRET="703ac9e041c4cc735dc66ce095cf2fdf6c7dbae8e648d071530e5eeeb723324"
ADMIN_ID="google_6f68256b1e3e005dab385a9f470f6cd14e014625"

# JWT generieren
cat > /tmp/gen-jwt.js << 'EOFJS'
const crypto = require('crypto');
const secret = process.env.SECRET;
const adminId = process.env.ADMIN_ID;

const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  aud: 'food-blog',
  exp: now + 300,
  nbf: now,
  iat: now,
  user: {
    id: adminId,
    name: 'Admin',
    admin: true,
    site_id: 'food-blog',
    provider: 'google'
  }
};

const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const data = `${headerB64}.${payloadB64}`;
const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
console.log(`${data}.${signature}`);
EOFJS

JWT=$(SECRET="$SECRET" ADMIN_ID="$ADMIN_ID" node /tmp/gen-jwt.js)

COMMENT_ID="$1"
if [ -z "$COMMENT_ID" ]; then
  echo "Usage: $0 <comment-id>"
  exit 1
fi

echo "=== Test 1: Direkt zu Remark42 Container (Port 8080) ==="
docker exec remark42 curl -v -X DELETE \
  "http://localhost:8080/api/v1/admin/comment/${COMMENT_ID}?site=food-blog" \
  -H "X-JWT: ${JWT}" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  2>&1

echo ""
echo ""
echo "=== Test 2: Über Caddy (HTTPS) ==="
curl -v -X DELETE \
  "https://comments.die-mama-kocht.de/api/v1/admin/comment/${COMMENT_ID}?site=food-blog" \
  -H "X-JWT: ${JWT}" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  2>&1
