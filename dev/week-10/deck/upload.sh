#!/usr/bin/env bash
# Upload the week-10 deck to the DEV Superset tier.
#
#   ./upload.sh                 # dev (superset-dev), the default
#
# PROD IS NOT A TARGET OF THIS SCRIPT. A prod copy is a separate, deliberate
# export/import (see README.md), not a flag on the dev path — and for this
# deck prod additionally needs the Cookie Cats licence ruling (README §5).
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
SLUG="${SLUG:-mbua512-week-10-ab-testing}"
PAYLOAD="payload.json"

if [ "$NS" = "superset" ]; then
  echo "ERROR: this script does not target prod. See README.md." >&2
  exit 1
fi

echo "=== 1/4  building the payload ==="
python3 build-payload.py --slug "$SLUG"

POD=$(kubectl --context "$CONTEXT" get pods -n "$NS" -l app=superset \
        -o name | head -1 | sed 's|^pod/||')
if [ -z "$POD" ]; then
  echo "ERROR: no superset pod in namespace ${NS}" >&2
  exit 1
fi
echo ""
echo "=== 2/4  copying into ${NS}/${POD} ==="
kubectl --context "$CONTEXT" cp "$PAYLOAD" \
  "${NS}/${POD}:/tmp/w10-payload.json" -c superset
kubectl --context "$CONTEXT" cp upload-deck.py \
  "${NS}/${POD}:/tmp/w10-upload.py" -c superset

echo ""
echo "=== 3/4  running it through superset shell ==="
# ONE line. Piping the script itself into the REPL silently drops every
# compound statement not followed by a blank line.
echo 'exec(open("/tmp/w10-upload.py").read())' \
  | kubectl --context "$CONTEXT" exec -i -n "$NS" "$POD" -c superset \
      -- superset shell >/dev/null 2>&1 || true

echo ""
echo "=== 4/4  result ==="
# stdout through the shell is unreliable; the script writes a file and we
# read that.
kubectl --context "$CONTEXT" exec -n "$NS" "$POD" -c superset \
  -- cat /tmp/w10-result.json

echo ""
echo ""
echo "If status is \"created\":"
echo "  https://learn-dev.datascie.nz/grading/#/decks/${SLUG}"
echo "  then run the checks in README.md (verify-week09-deck.js takes SLUG)."
