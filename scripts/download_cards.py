#!/usr/bin/env python3
"""Download the 100 resolved images to public/cards/local-{N}.jpg.

Source: scripts/cards-resolved.json
"""
from __future__ import annotations
import json
import os
import sys
import time
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

UA = "DixitGame/1.0 (umesh_ravuru@intuit.com)"
OUT_DIR = "public/cards"
MAX_BYTES = 2_000_000  # 2 MB cap per image (resize/skip if larger)
SLEEP_BETWEEN = 1.0  # be polite — wikimedia rate-limits aggressively

def fetch(url: str, max_retries: int = 5) -> bytes:
    backoff = 2.0
    for attempt in range(max_retries):
        try:
            req = Request(url, headers={"User-Agent": UA})
            with urlopen(req, timeout=60) as r:
                return r.read(MAX_BYTES + 1)
        except HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                print(f"    429 — sleeping {backoff}s", file=sys.stderr)
                time.sleep(backoff)
                backoff *= 2
                continue
            raise
    raise RuntimeError("max retries exceeded")


os.makedirs(OUT_DIR, exist_ok=True)

with open("scripts/cards-resolved.json") as f:
    data = json.load(f)

ok = 0
fail = 0
for i, img in enumerate(data["images"]):
    # Strip query params from URL — wikimedia adds analytics params that don't matter
    url = img["thumb"].split("?", 1)[0]
    # Determine extension from URL
    path = urlparse(url).path
    ext = os.path.splitext(path)[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    out_path = os.path.join(OUT_DIR, f"local-{i}{ext}")
    if os.path.exists(out_path):
        ok += 1
        continue
    try:
        content = fetch(url)
        if len(content) > MAX_BYTES:
            smaller = url.replace("/960px-", "/480px-")
            content = fetch(smaller)
        with open(out_path, "wb") as wf:
            wf.write(content)
        print(f"  [{i:3d}] {img['title']} -> {out_path} ({len(content):,} bytes)")
        ok += 1
        time.sleep(SLEEP_BETWEEN)
    except Exception as e:
        print(f"  ! [{i:3d}] FAIL {img['title']}: {e}", file=sys.stderr)
        fail += 1
        time.sleep(SLEEP_BETWEEN)

print(f"\nDone. ok={ok} fail={fail}")
