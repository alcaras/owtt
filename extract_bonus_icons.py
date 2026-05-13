#!/usr/bin/env python3
"""Extract bonus-card icon PNGs from Old World's Unity asset bundle.

Reads `zIconName` for every bonus tech in XML/Infos/tech.xml, then pulls the
matching Sprite objects from the game's resources.assets via UnityPy and
writes them as PNGs into img/icons/bonus/<lowercase-name>.png.

Run after a fresh game install or after a patch that changes icons:

    python3 extract_bonus_icons.py
"""
import gc
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import UnityPy

GAME_DATA = (
    Path.home()
    / "Library/Application Support/Steam/steamapps/common"
    / "Old World/OldWorld.app/Contents/Resources/Data"
)
OUT_DIR = Path(__file__).parent / "img/icons/bonus"


def _trim_transparent(img):
    """Crop fully-transparent borders so the visible artwork fills the canvas.
    Falls back to the original image if alpha is missing or fully empty."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def wanted_icon_names() -> set[str]:
    """Read every non-disabled bonus tech's zIconName from tech.xml."""
    root = ET.parse(Path(__file__).parent / "XML/Infos/tech.xml").getroot()
    names: set[str] = set()
    for entry in root.findall("Entry"):
        z_type = entry.findtext("zType") or ""
        if entry.findtext("bDisable") == "1":
            continue
        if "BONUS" not in z_type and "RESOURCE" not in z_type:
            continue
        icon = entry.findtext("zIconName")
        if icon:
            names.add(icon)
    return names


def main() -> int:
    if not GAME_DATA.exists():
        print(f"Game data not found at {GAME_DATA}")
        return 1

    targets = wanted_icon_names()
    print(f"Looking for {len(targets)} bonus icons in resources.assets…")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    env = UnityPy.load(str(GAME_DATA / "resources.assets"))
    saved = 0
    missing = set(targets)

    for i, obj in enumerate(env.objects):
        if obj.type.name != "Sprite":
            continue
        try:
            d = obj.read()
            name = getattr(d, "m_Name", "") or ""
            if name in targets:
                img = d.image
                if img:
                    out = OUT_DIR / f"{name.lower()}.png"
                    # Auto-crop the transparent margins so cards with sparse
                    # source art (e.g. BOOST_STONE — a tiny block on a
                    # 250×250 canvas) end up the same visible size as cards
                    # with full-bleed portraits (BONUS_WORKER).
                    cropped = _trim_transparent(img)
                    cropped.save(out)
                    saved += 1
                    missing.discard(name)
                    del img, cropped
            del d
        except Exception as e:
            print(f"  skip object {i}: {e}", file=sys.stderr)
        if i % 500 == 0:
            gc.collect()

    print(f"Saved {saved} icons → {OUT_DIR}")
    if missing:
        print(f"Missing from bundle ({len(missing)}): {sorted(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
