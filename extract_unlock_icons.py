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
    saved = {k: 0 for k in PREFIXES}

    for i, obj in enumerate(env.objects):
        if obj.type.name != "Sprite":
            continue
        try:
            d = obj.read()
            name = getattr(d, "m_Name", "") or ""
            for prefix, dest in PREFIXES.items():
                if name.startswith(prefix):
                    out = dest / f"{name.lower()}.png"
                    if out.exists():
                        break
                    img = d.image
                    if img:
                        img.save(out)
                        saved[prefix] += 1
                        del img
                    break
            del d
        except Exception as e:
            print(f"  skip {i}: {e}", file=sys.stderr)
        if i % 500 == 0:
            gc.collect()

    for p, n in saved.items():
        print(f"  {p:15s} {n} new icons")
    return 0


if __name__ == "__main__":
    sys.exit(main())
