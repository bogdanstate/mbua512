#!/usr/bin/env bash
# Upload the week-09 deck to a Superset tier.
#
#   ./upload.sh                 # dev (superset-dev), the default
#   NS=superset-dev ./upload.sh
#
# PROD IS NOT A TARGET OF THIS SCRIPT. The prod copy is a separate,
# deliberate export/import (see README.md), not a flag on the dev path.
#
# What it does:
#   1. builds payload.json from the local tree (build-payload.py, which
#      refuses to build a broken one);
#   2. copies the payload and the in-pod script into the tier's web pod;
#   3. runs the script through `superset shell` as ONE exec() line;
#   4. cats the result JSON back out and prints it.
#
# It never overwrites an existing deck: the in-pod script checks the slug
# first and stops if it is taken.
set -euo pipefail
cd "$(dirname "$0")"

# The scienz context. NEVER the -oidc one.
unset KUBECONFIG
CONTEXT="${CONTEXT:-scienz-scienz}"
NS="${NS:-superset-dev}"
# Which of the two week-9 decks (instructor split, 2026-09-23).
DECK="${DECK:-}"
case "$DECK" in
  a) SLUG="${SLUG:-mbua512-week-09a-correlation}" ;;
  b) SLUG="${SLUG:-mbua512-week-09b-regression}" ;;
  *) echo "ERROR: set DECK=a or DECK=b (a = correlation, b = regression)." >&2
     exit 1 ;;
esac
PAYLOAD="payload-${DECK}.json"

if [ "$NS" = "superset" ]; then
  echo "ERROR: this script does not target prod. See README.md." >&2
  exit 1
fi

echo "=== 1/4  building the payload ==="
python3 split-deck.py

# PINS. `Pin result` writes its rows INTO THE DECK SOURCE on the tier, and the
# authoring source here has never carried them -- so a plain rebuild+PUT wipes
# every pinned result. On prod that is the only data students ever see.
# So: pull the tier's current content first and carry its pins onto the
# rebuilt deck, matched by SQL text (never by position -- slides move).
# CARRY_PINS=0 skips this deliberately (e.g. a brand-new deck with no pins).
if [ "${CARRY_PINS:-1}" = "1" ]; then
  cat > /tmp/w9-dump.py <<'PYEOF'
from superset_grading.models import GradingSlideDeck
from superset.extensions import db
d = db.session.query(GradingSlideDeck).filter_by(slug="SLUG_HERE").one_or_none()
open("/tmp/w9-live.md", "w").write((d.content or "") if d else "")
print("ok")
PYEOF
  sed -i "s/SLUG_HERE/${SLUG}/" /tmp/w9-dump.py
  kubectl --context "$CONTEXT" cp /tmp/w9-dump.py "${NS}/${POD_FOR_PINS:-$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset -o name | head -1 | sed 's|^pod/||')}:/tmp/w9-dump.py" -c superset
  PODP=$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset -o name | head -1 | sed 's|^pod/||')
  echo 'exec(open("/tmp/w9-dump.py").read())' \
    | kubectl --context "$CONTEXT" exec -i -n "$NS" "$PODP" -c superset -- superset shell >/dev/null 2>&1 || true
  kubectl --context "$CONTEXT" exec -n "$NS" "$PODP" -c superset -- cat /tmp/w9-live.md > /tmp/w9-live.md 2>/dev/null || : > /tmp/w9-live.md
  if [ -s /tmp/w9-live.md ]; then
    python3 carry-pins.py --live /tmp/w9-live.md --into "deck-${DECK}.md"
  else
    echo "    no live deck content (new deck?) -- nothing to carry"
  fi
fi

python3 build-payload.py --deck "$DECK" --slug "$SLUG"

POD=$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset \
        -o name | head -1 | sed 's|^pod/||')
if [ -z "$POD" ]; then
  echo "ERROR: no superset pod in namespace ${NS}" >&2
  exit 1
fi
echo ""
echo "=== 2/4  copying into ${NS}/${POD} ==="
kubectl --context "$CONTEXT" cp "$PAYLOAD" \
  "${NS}/${POD}:/tmp/w9-payload.json" -c superset
kubectl --context "$CONTEXT" cp upload-deck.py \
  "${NS}/${POD}:/tmp/w9-upload.py" -c superset

echo ""
echo "=== 3/4  running it through superset shell ==="
# ONE line. Piping the script itself into the REPL silently drops every
# compound statement not followed by a blank line.
echo 'exec(open("/tmp/w9-upload.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset \
      -- superset shell >/dev/null 2>&1 || true

echo ""
echo "=== 4/4  result ==="
# stdout through the shell is unreliable; the script writes a file and we
# read that.
kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset \
  -- cat /tmp/w9-result.json

echo ""
echo ""
echo "If status is \"created\":"
echo "  https://learn-dev.datascie.nz/grading/#/decks/${SLUG}"
echo "  then run the checks in README.md (sizes, contrast, verify-week09-deck.js)."
