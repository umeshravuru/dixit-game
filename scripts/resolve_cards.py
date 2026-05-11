#!/usr/bin/env python3
"""Resolve ~100 dreamlike/surreal art images from Wikimedia Commons.

Run with Python 3.10+.


For each file, we get:
  - working thumbnail URL (Wikimedia)
  - download URL (full image)
  - a friendly title

Output: scripts/cards-resolved.json
"""
from __future__ import annotations
import json
import re
import sys
import time
from typing import Optional
from urllib.parse import quote
from urllib.request import Request, urlopen

UA = "DixitGame/1.0 (umesh_ravuru@intuit.com) Python/urllib"

# Curated art categories on Commons. Each has many public-domain paintings.
CATEGORIES = [
    "Symbolist_paintings",
    "Surrealist_paintings",
    "Romantic_paintings",
    "Pre-Raphaelite_paintings",
    "Paintings_by_Hieronymus_Bosch",
    "Paintings_by_Caspar_David_Friedrich",
    "Paintings_by_Henri_Rousseau",
    "Paintings_by_Gustave_Moreau",
    "Paintings_by_Odilon_Redon",
    "Paintings_by_Maxfield_Parrish",
    "Paintings_by_John_William_Waterhouse",
    "Paintings_by_Arnold_Böcklin",
    "Paintings_by_Edmund_Dulac",
    "Paintings_by_Gustave_Doré",
    "Paintings_by_William_Blake",
    "Paintings_by_J._M._W._Turner",
    "Paintings_by_Albert_Bierstadt",
    "Paintings_by_Thomas_Cole",
    "Paintings_by_John_Atkinson_Grimshaw",
    "Paintings_by_Edvard_Munch",
    "Paintings_by_Marc_Chagall",
    "Paintings_by_René_Magritte",
    "Paintings_by_Paul_Klee",
    "Paintings_by_Gustav_Klimt",
    "Paintings_by_Ivan_Aivazovsky",
    "Paintings_by_Henry_Fuseli",
    "Paintings_by_Francisco_Goya",
    "Paintings_by_Hokusai",
]

def get(url):
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def list_category_files(category, limit=30):
    url = (
        "https://commons.wikimedia.org/w/api.php?"
        f"action=query&list=categorymembers&cmtitle=Category:{quote(category)}"
        f"&cmtype=file&cmlimit={limit}&format=json"
    )
    try:
        data = get(url)
    except Exception as e:
        print(f"  ! category failed: {category}: {e}", file=sys.stderr)
        return []
    return [m["title"] for m in data.get("query", {}).get("categorymembers", [])]

def resolve_image(title):
    """Get working thumb URL + full URL + safe title for a File: page."""
    url = (
        "https://commons.wikimedia.org/w/api.php?"
        f"action=query&titles={quote(title)}"
        "&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json"
    )
    try:
        data = get(url)
    except Exception as e:
        print(f"  ! resolve failed: {title}: {e}", file=sys.stderr)
        return None
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        info = page.get("imageinfo", [{}])[0]
        if not info.get("url"):
            continue
        mime = info.get("mime", "")
        if not mime.startswith("image/"):
            continue
        # GIFs and SVGs unsuitable for card art
        if mime in ("image/gif", "image/svg+xml"):
            continue
        thumb = info.get("thumburl") or info.get("url")
        full = info.get("url")
        # Strip "File:" prefix and extension for friendly title
        nice = title.replace("File:", "").rsplit(".", 1)[0]
        # Collapse underscores → spaces
        nice = nice.replace("_", " ")
        # Strip trailing junk like "(1879)", artist-name prefix etc.
        nice = re.sub(r"\s*\([^)]*\d{4}[^)]*\)\s*$", "", nice)
        nice = re.sub(r"\s+\d+\s*$", "", nice)
        nice = nice.strip(" -–—")
        if len(nice) > 60:
            nice = nice[:57] + "..."
        return {"title": nice, "thumb": thumb, "full": full}
    return None

def main():
    seen_urls = set()
    resolved = []
    target = 100

    for cat in CATEGORIES:
        if len(resolved) >= target:
            break
        print(f"category: {cat}", file=sys.stderr)
        files = list_category_files(cat, limit=20)
        for f in files:
            if len(resolved) >= target:
                break
            info = resolve_image(f)
            if info is None:
                continue
            if info["full"] in seen_urls:
                continue
            seen_urls.add(info["full"])
            resolved.append(info)
            print(f"  + [{len(resolved):3d}] {info['title']}", file=sys.stderr)
            time.sleep(0.05)  # be polite

    out = {"images": resolved[:target]}
    print(json.dumps(out, indent=2))
    print(f"\nResolved {len(resolved)} images.", file=sys.stderr)

if __name__ == "__main__":
    main()
