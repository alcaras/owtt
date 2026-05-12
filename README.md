# Old World Tech Tree

An interactive tech tree planner for the strategy game [Old World](https://store.steampowered.com/app/597180/Old_World/) by Mohawk Games.

Live: [https://alcaras.github.io/owtt/](https://alcaras.github.io/owtt/) · Mobile: [/phone.html](https://alcaras.github.io/owtt/phone.html)

## Features

- **Full tech tree** — 49 main technologies + 60 bonus cards, with accurate prerequisites and unlocks.
- **13 nations** (base game + EOTI DLC), each with their own starting techs and unique unit bonus cards.
- **Click to plan** — clicking a tech auto-pulls its prereqs in the cheapest order. Right-click toggles "already researched".
- **Cost tracking** — live total science and laws unlocked.
- **Share via URL** — every plan encodes to `?n=&o=` so you can paste a link and the other person sees the same build. URLs are versioned (`v=`) so they survive game updates.
- **Monte-Carlo simulation** — 1,000-run simulation per Scholar/Oracle combination to estimate variance in actual research cost vs. raw tech cost.
- **Phone surface** — separate mobile-first layout at `/phone.html` with tier-by-tier scroll, bottom-sheet research plan, and a nation picker.
- **Installable as a PWA** — manifest + service worker; "Add to Home Screen" works on iOS and Android, and the app keeps running offline once visited.

## Nations

| Nation | Starting techs |
|---|---|
| Aksum | Trapping · Labor Force · Administration |
| Assyria | Trapping · Administration · Military Drill |
| Babylonia | Trapping · Administration · Rhetoric |
| Carthage | Trapping · Divination · Aristocracy |
| Egypt | Ironworking · Stonecutting · Labor Force |
| Greece | Ironworking · Stonecutting · Drama |
| Hittites | Ironworking · Husbandry · Administration |
| Kush | Trapping · Stonecutting · Divination |
| Maurya | Ironworking · Stonecutting · Administration |
| Persia | Ironworking · Trapping · Husbandry |
| Rome | Ironworking · Stonecutting · Polis |
| Tamil | Divination · Trapping · Ironworking |
| Yuezhi | Military Drill · Husbandry |

## Data Source

All technology data is extracted directly from the Old World XML game files (see `CLAUDE.md` for the parser pipeline). No copyrighted game content is checked into this repo.

## Updating after a new game patch

```bash
cp ~/Library/Application\ Support/Steam/steamapps/common/Old\ World/Reference/XML/Infos/{tech,text-infos,bonus,nation,text-nation,unit,improvement,law,project,effectPlayer,text-bonus}.xml XML/Infos/
python3 generate_tech_tree.py --xml-dir XML/Infos
python3 -m unittest test_parser -v
```

The parser writes `tech-data.js` at the repo root. Everything else (`index.html`, `phone.html`, `tree-app.js`, `tree-styles.css`, `phone-app.js`, `sw.js`, `manifest.webmanifest`, `img/`) is static and committed.
