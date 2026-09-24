#!/usr/bin/env bash
# Update the week-10 deck on the dev tier (prod is a separate procedure).
#
#   ./update.sh                # dev
#   FORCE=1 ./update.sh        # discard a newer server copy — see below
#   CARRY_PINS=0 ./update.sh   # do not carry pinned results across
#
# Unlike upload.sh this one TOUCHES AN EXISTING DECK, so it carries two
# safeguards, both paid for in real incidents:
#
#  1. THE STALE GUARD. The payload records the server's `updated_at` at build
#     time and the in-pod script refuses if the server has moved since. The
#     instructor edits decks live; overwriting that has happened before
#     (2026-09-14) and cost a revision-table restore. FORCE=1 skips it, and is
#     only correct immediately after reading the server copy.
#
#  2. PIN CARRYING. `Pin result` writes its rows INTO THE DECK SOURCE on the
#     tier, and the authoring source here never carries them — so a plain
#     rebuild-and-PUT wipes every pinned result. Students never execute a
#     query, so a pinned table is the only data their browser ever sees: a
#     wiped pin leaves them SQL and nothing. The live content is pulled first
#     and its pins carried onto the rebuilt deck, matched by SQL TEXT rather
#     than by position (slides move; that is usually why we are here).
set -euo pipefail
cd "$(dirname "$0")"

unset KUBECONFIG
CONTEXT="${CONTEXT:-scienz-scienz}"
NS="${NS:-superset-dev}"
SLUG="${SLUG:-mbua512-week-10-ab-testing}"
PAYLOAD="payload.json"

if [ "$NS" = "superset" ]; then
  echo "ERROR: this script does not target prod. See README.md." >&2
  exit 1
fi

POD=$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset \
        -o name | head -1 | sed 's|^pod/||')
[ -n "$POD" ] || { echo "ERROR: no superset pod in ${NS}" >&2; exit 1; }

echo "=== 1/5  reading the server's updated_at ==="
cat > /tmp/w10-probe.py <<'PY'
import json
from superset.extensions import db
from superset_grading.models import GradingSlideDeck
d = db.session.query(GradingSlideDeck).filter_by(slug="SLUG_HERE").one_or_none()
out = {"found": d is not None}
if d is not None:
    out.update({"id": d.id, "updated_at": str(d.updated_at),
                "blocks": len((d.content or "").split("\n---\n"))})
open("/tmp/w10-probe.json", "w").write(json.dumps(out))
print("ok")
PY
sed -i "s/SLUG_HERE/${SLUG}/" /tmp/w10-probe.py
kubectl --context "$CONTEXT" cp /tmp/w10-probe.py "${NS}/${POD}:/tmp/w10-probe.py" -c superset
echo 'exec(open("/tmp/w10-probe.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset -- superset shell >/dev/null 2>&1 || true
PROBE=$(kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset -- cat /tmp/w10-probe.json)
echo "    $PROBE"
BASE=$(printf '%s' "$PROBE" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("updated_at",""))')

echo ""
echo "=== 2/5  building the payload ==="
if [ "${CARRY_PINS:-1}" = "1" ]; then
  cat > /tmp/w10-dump.py <<'PYEOF'
from superset_grading.models import GradingSlideDeck
from superset.extensions import db
d = db.session.query(GradingSlideDeck).filter_by(slug="SLUG_HERE").one_or_none()
open("/tmp/w10-live.md", "w").write((d.content or "") if d else "")
print("ok")
PYEOF
  sed -i "s/SLUG_HERE/${SLUG}/" /tmp/w10-dump.py
  kubectl --context "$CONTEXT" cp /tmp/w10-dump.py "${NS}/${POD}:/tmp/w10-dump.py" -c superset
  echo 'exec(open("/tmp/w10-dump.py").read())' \
    | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset -- superset shell >/dev/null 2>&1 || true
  kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset -- cat /tmp/w10-live.md > /tmp/w10-live.md 2>/dev/null || : > /tmp/w10-live.md
  if [ -s /tmp/w10-live.md ]; then
    python3 carry-pins.py --live /tmp/w10-live.md --into deck.md
  else
    echo "    no live deck content (new deck?) — nothing to carry"
  fi
fi

python3 build-payload.py --slug "$SLUG"
python3 - "$BASE" "$PAYLOAD" <<'PY'
import json, os, pathlib, sys
p = pathlib.Path(sys.argv[2])
d = json.loads(p.read_text())
d["base_updated_at"] = sys.argv[1]
if os.environ.get("FORCE"):
    d["force"] = True
p.write_text(json.dumps(d))
print(f"    base_updated_at = {sys.argv[1]!r}  force={bool(os.environ.get('FORCE'))}")
PY

echo ""
echo "=== 3/5  copying into ${NS}/${POD} ==="
kubectl --context "$CONTEXT" cp "$PAYLOAD" "${NS}/${POD}:/tmp/w10-payload.json" -c superset
kubectl --context "$CONTEXT" cp update-deck.py "${NS}/${POD}:/tmp/w10-update.py" -c superset

echo ""
echo "=== 4/5  running it ==="
echo 'exec(open("/tmp/w10-update.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset -- superset shell >/dev/null 2>&1 || true

echo ""
echo "=== 5/5  result ==="
kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset -- cat /tmp/w10-result.json
echo ""
