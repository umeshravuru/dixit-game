#!/usr/bin/env python3
"""Remove flagged unsafe cards, reindex remaining, rewrite cards.ts + delete local files.

Usage: python3 scripts/prune_cards.py
"""
from __future__ import annotations
import json
import os

# IDs to remove (current numbering, before reindex).
REMOVE_IDS = {14, 15, 25, 28, 32, 80, 81, 82, 83, 84, 85, 86}

with open("scripts/cards-resolved.json") as f:
    data = json.load(f)

original = data["images"]
print(f"Before: {len(original)} cards")

# Delete local files for removed IDs
removed_files = []
for old_id in sorted(REMOVE_IDS):
    for ext in (".jpg", ".jpeg", ".png"):
        path = f"public/cards/local-{old_id}{ext}"
        if os.path.exists(path):
            os.remove(path)
            removed_files.append(path)
            print(f"  deleted {path}")

# Filter and renumber
kept = [(i, img) for i, img in enumerate(original) if i not in REMOVE_IDS]
print(f"After:  {len(kept)} cards")

# Rename local files to new contiguous IDs
# (using mv to preserve any extension)
renamed = []
for new_id, (old_id, img) in enumerate(kept):
    if new_id == old_id:
        continue
    for ext in (".jpg", ".jpeg", ".png"):
        src = f"public/cards/local-{old_id}{ext}"
        if os.path.exists(src):
            dst = f"public/cards/local-{new_id}{ext}"
            os.rename(src, dst)
            renamed.append((src, dst))
            break
for s, d in renamed:
    print(f"  renamed {s} -> {d}")

# Update the resolved JSON to match
new_images = [img for _, img in kept]
data["images"] = new_images
with open("scripts/cards-resolved.json", "w") as f:
    json.dump(data, f, indent=2)
print(f"\nUpdated scripts/cards-resolved.json")
print(f"Now run: python3 scripts/generate_cards_ts.py")
