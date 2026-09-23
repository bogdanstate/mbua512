#!/usr/bin/env bash
# Update the week-09 deck on a tier (dev only; prod is a separate procedure).
#
#   ./update.sh                # dev
#   FORCE=1 ./update.sh        # discard a newer server copy — see below
#
# Unlike upload.sh this one TOUCHES AN EXISTING DECK, so it carries the stale
# guard: the payload records the server's `updated_at` at build time, and the
# in-pod script refuses if the server has moved since. The instructor edits
# decks live; overwriting that has happened before and cost a restore.
#
# FORCE=1 skips the guard. Use it only right after reading the server copy.
set -euo pipefail
cd "$(dirname "$0")"

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

POD=$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset \
        -o name | head -1 | sed 's|^pod/||')
[ -n "$POD" ] || { echo "ERROR: no superset pod in ${NS}" >&2; exit 1; }

echo "=== 1/5  reading the server's updated_at ==="
cat > /tmp/w9-probe.py <<'PY'
import json
from superset.extensions import db
from superset_grading.models import GradingSlideDeck
d = db.session.query(GradingSlideDeck).filter_by(slug="SLUG_HERE").one_or_none()
out = {"found": d is not None}
if d is not None:
    out.update({"id": d.id, "updated_at": str(d.updated_at),
                "blocks": len((d.content or "").split("\n---\n"))})
open("/tmp/w9-probe.json", "w").write(json.dumps(out))
print("ok")
PY
sed -i "s/SLUG_HERE/${SLUG}/" /tmp/w9-probe.py
kubectl --context "$CONTEXT" cp /tmp/w9-probe.py "${NS}/${POD}:/tmp/w9-probe.py" -c superset
echo 'exec(open("/tmp/w9-probe.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset -- superset shell >/dev/null 2>&1 || true
PROBE=$(kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset -- cat /tmp/w9-probe.json)
echo "    $PROBE"
BASE=$(printf '%s' "$PROBE" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("updated_at",""))')

echo ""
echo "=== 2/5  building the payload ==="
python3 split-deck.py
python3 build-payload.py --deck "$DECK" --slug "$SLUG"
python3 - "$BASE" "$PAYLOAD" <<'PY'
import json, sys, pathlib
p = pathlib.Path(sys.argv[2])
d = json.loads(p.read_text())
d["base_updated_at"] = sys.argv[1]
import os
if os.environ.get("FORCE"):
    d["force"] = True
p.write_text(json.dumps(d))
print(f"    base_updated_at = {sys.argv[1]!r}  force={bool(os.environ.get('FORCE'))}")
PY

echo ""
echo "=== 3/5  copying into ${NS}/${POD} ==="
kubectl --context "$CONTEXT" cp "$PAYLOAD" "${NS}/${POD}:/tmp/w9-payload.json" -c superset
kubectl --context "$CONTEXT" cp update-deck.py "${NS}/${POD}:/tmp/w9-update.py" -c superset

echo ""
echo "=== 4/5  running it ==="
echo 'exec(open("/tmp/w9-update.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset -- superset shell >/dev/null 2>&1 || true

echo ""
echo "=== 5/5  result ==="
kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset -- cat /tmp/w9-result.json
echo ""
