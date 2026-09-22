#!/usr/bin/env python3
"""Update the week-09 deck on a tier. RUNS INSIDE THE POD. See update.sh.

This is the companion to `upload-deck.py`: that one creates and refuses to
touch an existing deck, this one updates one that wave 1 created.

THE STALE GUARD, AND WHY IT IS NOT OPTIONAL
-------------------------------------------
The instructor edits decks live in the platform editor. On 2026-09-14 an
uploader PUT a whole local deck.md over three slides the instructor had just
rewritten, and the recovery was a restore from a revision row. So:

  * the payload carries `base_updated_at` — the `updated_at` this local copy
    was built against;
  * if the server's `updated_at` is NEWER, this refuses and reports STALE,
    changing nothing. The caller then re-reads the server content and decides.

Pass `"force": true` in the payload only when you have just read the server
copy and know what you are discarding.

WHAT IT UPDATES
---------------
`content`, `css_content` (+ its asset) and any NEW assets. It never deletes an
asset: the old PNGs stay addressable so an older revision still renders.
"""

import base64
import hashlib
import json
import traceback

RESULT_PATH = "/tmp/w9-result.json"
PAYLOAD_PATH = "/tmp/w9-payload.json"


def _write(result):
    with open(RESULT_PATH, "w") as fh:
        json.dump(result, fh, indent=1, default=str)


def _run():
    import re as _re

    from flask_appbuilder.security.sqla.models import User
    from superset.extensions import db
    from superset_grading.models import GradingSlideAsset, GradingSlideDeck

    with open(PAYLOAD_PATH) as fh:
        payload = json.load(fh)

    slug = payload["slug"]
    deck = db.session.query(GradingSlideDeck).filter_by(slug=slug).one_or_none()
    if deck is None:
        return {
            "status": "missing",
            "message": f"no deck {slug!r} — use upload-deck.py to create it",
        }

    server_updated = str(deck.updated_at)
    base = payload.get("base_updated_at")
    if base and server_updated != base and not payload.get("force"):
        return {
            "status": "stale",
            "message": (
                "the server copy moved since this payload was built; refusing "
                "to overwrite. Re-read the deck and re-apply your change."
            ),
            "server_updated_at": server_updated,
            "payload_built_against": base,
        }

    owner_name = payload.get("owner", "bogdanstate")
    owner = db.session.query(User).filter_by(username=owner_name).one_or_none()
    if owner is None:
        owner = db.session.query(User).order_by(User.id).first()

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

    content = payload["content"]
    for name, url in uploaded.items():
        content = content.replace(f"asset:{name}", url)
    missing = sorted(set(_re.findall(r"asset:([\w.-]+)", content)))
    deck.content = content

    css = payload.get("css_content")
    css_changed = False
    if css and css != (deck.css_content or ""):
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
                filename="mbua512-week-09.css",
                content_type="text/css",
                data=css_raw,
                size_bytes=len(css_raw),
                created_by_id=owner.id,
            )
            db.session.add(css_asset)
            db.session.flush()
        deck.css_asset_hash = css_hash
        css_changed = True

    db.session.commit()

    blocks = deck.content.split("\n---\n")
    return {
        "status": "updated",
        "deck_id": deck.id,
        "slug": deck.slug,
        "markdown_blocks": len(blocks),
        "slides_expected": len(blocks) - 1,
        "assets_total": len(uploaded),
        "css_changed": css_changed,
        "css_asset_hash": deck.css_asset_hash,
        "unsubstituted_asset_tokens": missing,
        "previous_updated_at": server_updated,
        "updated_at": deck.updated_at,
    }


try:
    _write(_run())
except Exception:
    _write({"status": "error", "traceback": traceback.format_exc()})

print(f"WROTE {RESULT_PATH}")
