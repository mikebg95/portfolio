#!/usr/bin/env bash
# Builds the Docker image, runs it on a free port and checks what it serves:
#   /, /nl/ → 200; an unknown URL → 404 with the 404 sheet (English and Dutch);
#   HTML no-cache, hashed /_astro/ assets immutable; brotli and gzip served precompressed;
#   /experience → relative redirect to /experience/.
# Usage: scripts/docker-smoke.sh   (needs Docker; exits non-zero on the first failure)
set -euo pipefail

cd "$(dirname "$0")/.."
IMAGE="${IMAGE:-michaelgoldman-dev:smoke}"

docker build -t "$IMAGE" .
CID="$(docker run -d --rm -p 127.0.0.1::8080 "$IMAGE")"
trap 'docker stop "$CID" >/dev/null' EXIT
PORT="$(docker port "$CID" 8080/tcp | head -1 | sed 's/.*://')"
BASE="http://127.0.0.1:$PORT"

for _ in $(seq 1 50); do
  curl -fsS -o /dev/null "$BASE/" 2>/dev/null && break
  sleep 0.2
done

fail() { echo "FAIL: $*" >&2; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
header() { curl -s -o /dev/null -D - "${@:2}" | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d' ' -f2-; }

[ "$(status "$BASE/")" = 200 ] || fail "/ is not 200"
[ "$(status "$BASE/nl/")" = 200 ] || fail "/nl/ is not 200"

[ "$(status "$BASE/no-such-sheet/")" = 404 ] || fail "unknown URL is not 404"
curl -s "$BASE/no-such-sheet/" | grep -q '<html lang="en"' || fail "unknown URL does not serve the English 404 sheet"
[ "$(status "$BASE/nl/no-such-sheet/")" = 404 ] || fail "unknown /nl/ URL is not 404"
curl -s "$BASE/nl/no-such-sheet/" | grep -q '<html lang="nl"' || fail "unknown /nl/ URL does not serve the Dutch 404 sheet"

[ "$(header Cache-Control "$BASE/")" = no-cache ] || fail "HTML is not no-cache"
ASSET="$(curl -s "$BASE/" | grep -o '/_astro/[^"]*' | head -1)"
[ -n "$ASSET" ] || fail "no /_astro/ asset referenced from /"
header Cache-Control "$BASE$ASSET" | grep -q immutable || fail "$ASSET is not cached immutable"

[ "$(header Content-Encoding -H 'Accept-Encoding: br' "$BASE/")" = br ] || fail "/ not served as brotli"
[ "$(header Content-Encoding -H 'Accept-Encoding: gzip' "$BASE/")" = gzip ] || fail "/ not served as gzip"

[ "$(status "$BASE/experience")" = 301 ] || fail "/experience does not redirect"
[ "$(header Location "$BASE/experience")" = /experience/ ] || fail "/experience redirect is not relative"

docker exec "$CID" sh -c '[ "$(id -u)" != 0 ]' || fail "nginx runs as root"

echo "docker-smoke: all checks passed ($IMAGE on port $PORT)"
