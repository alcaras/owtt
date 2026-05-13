#!/usr/bin/env python3
"""Extract unit / improvement / law / project icons from Old World's Unity
bundle. Mirrors extract_bonus_icons.py but for tech-unlock tooltip art.

Output: img/icons/{unit,improvement,law,project}/<slug>.png  (lowercase)
"""
import gc
import sys
from pathlib import Path

import UnityPy

GAME_DATA = (
    Path.home()
    / "Library/Application Support/Steam/steamapps/common"
    / "Old World/OldWorld.app/Contents/Resources/Data"
)
ROOT = Path(__file__).parent / "img/icons"

PREFIXES = {
    "UNIT_": ROOT / "unit",
    "IMPROVEMENT_": ROOT / "improvement",
    "LAW_": ROOT / "law",
    "PROJECT_": ROOT / "project",
}


def main() -> int:
    if not GAME_DATA.exists():
        print(f"Game data not found at {GAME_DATA}")
        return 1

    for d in PREFIXES.values():
        d.mkdir(parents=True, exist_ok=True)

    env = UnityPy.load(str(GAME_DATA / "resources.assets"))

    # Old World ships TWO sprites per unit under the same UNIT_<NAME> identifier:
    # a 128×128 colored portrait (production thumbnail) and a smaller (~58×58)
    # white silhouette glyph used on map shields. We want the silhouette for our
    # tooltip art — collect *all* candidates per name then pick the smallest.
    candidates: dict[tuple[str, str], list] = {}
    for obj in env.objects:
        if obj.type.name != "Sprite":
            continue
        try:
            d = obj.read()
            name = getattr(d, "m_Name", "") or ""
            for prefix in PREFIXES:
                if name.startswith(prefix):
                    img = d.image
                    if img:
                        candidates.setdefault((prefix, name), []).append((img.size[0] * img.size[1], img))
                    break
            del d
        except Exception as e:
            print(f"  skip: {e}", file=sys.stderr)

    saved = {p: 0 for p in PREFIXES}
    for (prefix, name), variants in candidates.items():
        # Sort by area; smallest wins (the silhouette glyph for units; the only
        # variant for the other categories).
        variants.sort(key=lambda v: v[0])
        img = variants[0][1]
        out = PREFIXES[prefix] / f"{name.lower()}.png"
        img.save(out)
        saved[prefix] += 1

    for p, n in saved.items():
        print(f"  {p:15s} {n} icons")
    return 0


if __name__ == "__main__":
    sys.exit(main())
