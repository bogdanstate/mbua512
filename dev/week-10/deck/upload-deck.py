#!/usr/bin/env python3
"""Upload the week-10 deck to a Superset tier. RUNS INSIDE THE POD.

This is not run directly. `upload.sh` copies it and a JSON payload into the
tier's web pod and executes it through `superset shell`:

    kubectl cp upload-deck.py  <ns>/<pod>:/tmp/w10-upload.py -c superset
    kubectl cp payload.json    <ns>/<pod>:/tmp/w10-payload.json -c superset
    echo 'exec(open("/tmp/w10-upload.py").read())' \
      | kubectl exec -i -n <ns> <pod> -c superset -- superset shell

WHY THE ONE-LINE `exec(open(...).read())`
-----------------------------------------
Piping the script itself into the interactive console silently breaks every
compound statement not followed by a blank line -- the first deck upload we
ever did ran roughly half its lines and reported success. The console is a
REPL, not a file reader. One `exec()` line hands it a single statement and the
file is parsed as a file.

WHY IT WRITES ITS RESULT TO A FILE
----------------------------------
stdout through `superset shell` is unreliable: banner text, SQLAlchemy warnings
and the REPL's own echo interleave with anything printed, and a long result can
be truncated. So every outcome goes to /tmp/w10-result.json and the caller
`kubectl exec … cat`s it back. Nothing important is ever only on stdout.

WHAT IT REFUSES TO DO
---------------------
It will NOT touch an existing deck. If the slug is present it writes a
`"status": "exists"` result and stops, changing nothing. Overwriting a deck the
instructor has edited live is a real incident that has happened on this
platform (the 2026-09-14 clobber), and wave 1's brief is explicit: never
overwrite, new slug only.
"""

import base64
import hashlib
import json
import traceback

RESULT_PATH = "/tmp/w10-result.json"
PAYLOAD_PATH = "/tmp/w10-payload.json"


def _write(result):
    with open(RESULT_PATH, "w") as fh:
        json.dump(result, fh, indent=1, default=str)


def _run():
    from superset.extensions import db
    from superset_grading.models import GradingSlideAsset, GradingSlideDeck

    with open(PAYLOAD_PATH) as fh:
        payload = json.load(fh)

    # Both models need a non-nullable created_by_id, and no request context
    # exists inside `superset shell`, so the owner is resolved explicitly.
    from flask_appbuilder.security.sqla.models import User

    owner_name = payload.get("owner", "bogdanstate")
    owner = db.session.query(User).filter_by(username=owner_name).one_or_none()
    if owner is None:
        owner = (
            db.session.query(User)
            .filter(User.username.in_(["admin", "bogdanstate"]))
            .first()
        )
    if owner is None:
        owner = db.session.query(User).order_by(User.id).first()
    if owner is None:
        return {"status": "error", "message": "no FAB user to own the deck"}

    slug = payload["slug"]
    existing = (
        db.session.query(GradingSlideDeck).filter_by(slug=slug).one_or_none()
    )
    if existing is not None:
        return {
            "status": "exists",
            "message": (
                f"deck {slug!r} already exists (id {existing.id}); refusing to "
                "touch it. Pick a new slug or delete it deliberately."
            ),
            "deck_id": existing.id,
            "updated_at": existing.updated_at,
        }

    deck = GradingSlideDeck(
        slug=slug,
        title=payload["title"],
        content=payload["content"],
        visibility=payload.get("visibility", "instructors"),
        created_by_id=owner.id,
    )
    db.session.add(deck)
    db.session.flush()

    # --- assets ------------------------------------------------------------
    # Keyed by content hash, so re-running with an unchanged image is a no-op.
    uploaded = {}
    for name, b64 in payload["assets"].items():
        raw = base64.b64decode(b64)
        digest = hashlib.sha256(raw).hexdigest()
        asset = (
            db.session.query(GradingSlideAsset)
            .filter_by(deck_id=deck.id, content_hash=digest)
            .one_or_none()
        )
        if asset is None:
            asset = GradingSlideAsset(
                deck_id=deck.id,
                content_hash=digest,
                filename=name,
                content_type="image/png",
                data=raw,
                size_bytes=len(raw),
                created_by_id=owner.id,
            )
            db.session.add(asset)
            db.session.flush()
        uploaded[name] = f"/api/v1/grading/decks/{slug}/assets/{digest}"

    # --- substitute asset:<file> placeholders ------------------------------
    import re as _re

    content = payload["content"]
    for name, url in uploaded.items():
        content = content.replace(f"asset:{name}", url)
    # Anything still spelled `asset:<file>` after substitution had no matching
    # upload, and would render as a broken image.
    missing = sorted(set(_re.findall(r"asset:([\w.-]+)", content)))
    deck.content = content

    # --- the stylesheet ----------------------------------------------------
    css = payload.get("css_content")
    if css:
        deck.css_content = css
        css_raw = css.encode()
        css_hash = hashlib.sha256(css_raw).hexdigest()
        css_asset = (
            db.session.query(GradingSlideAsset)
            .filter_by(deck_id=deck.id, content_hash=css_hash)
            .one_or_none()
        )
        if css_asset is None:
            css_asset = GradingSlideAsset(
                deck_id=deck.id,
                content_hash=css_hash,
                filename="mbua512-week-10.css",
                content_type="text/css",
                data=css_raw,
                size_bytes=len(css_raw),
                created_by_id=owner.id,
            )
            db.session.add(css_asset)
            db.session.flush()
        deck.css_asset_hash = css_hash

    db.session.commit()

    blocks = deck.content.split("\n---\n")
    return {
        "status": "created",
        "deck_id": deck.id,
        "slug": deck.slug,
        "title": deck.title,
        "visibility": deck.visibility,
        "markdown_blocks": len(blocks),
        "slides_expected": len(blocks) - 1,
        "assets": len(uploaded),
        "css_bytes": len(css or ""),
        "css_asset_hash": deck.css_asset_hash,
        "unsubstituted_asset_tokens": sorted(set(missing)),
        "updated_at": deck.updated_at,
    }


try:
    _write(_run())
except Exception:
    _write({"status": "error", "traceback": traceback.format_exc()})

print(f"WROTE {RESULT_PATH}")
