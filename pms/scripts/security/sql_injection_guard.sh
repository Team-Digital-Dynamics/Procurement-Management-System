#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TARGET_GLOB='src/main/java/**/*.java'
if ! command -v rg >/dev/null 2>&1; then
  echo "ERROR: ripgrep (rg) is required for sql_injection_guard.sh"
  exit 2
fi

echo "[SQLi Guard] Scanning Java sources for concatenated JPQL/SQL patterns..."

declare -a PATTERNS=(
  '@Query\\([^)]*\\+'
  'createQuery\\([^)]*\\+'
  'createNativeQuery\\([^)]*\\+'
  'SELECT\\s+.*"\\s*\\+'
  'FROM\\s+.*"\\s*\\+'
  'WHERE\\s+.*"\\s*\\+'
  'ORDER\\s+BY\\s+"\\s*\\+'
)

found=0
for pattern in "${PATTERNS[@]}"; do
  if rg -n --pcre2 "$pattern" $TARGET_GLOB; then
    found=1
  fi
done

if [[ $found -eq 1 ]]; then
  echo
  echo "[SQLi Guard] FAILED: Detected query construction that may allow SQL injection."
  echo "[SQLi Guard] Use Spring Data parameter binding (:name / ?1), TypedQuery#setParameter, or Criteria API."
  exit 1
fi

echo "[SQLi Guard] PASSED: No obvious concatenated JPQL/SQL query patterns found."
