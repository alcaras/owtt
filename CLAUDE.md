# Claude Development Notes

Guidance for Claude or human devs working on this Old World tech-tree project.

## Project Overview

An interactive tech-tree planner for Old World by Mohawk Games. The site has two surfaces, both deployed from the repo root:

- **Desktop** (`index.html`): 8-tier grid with prereq connection lines, sticky cost-tier header row, sidebar research plan, and a Monte-Carlo simulation modal.
- **Phone** (`phone.html`): vertical tier-by-tier list with a bottom-sheet research plan and a bottom-sheet nation picker.

Both pages read the same `tech-data.js`, which is **generated** by `generate_tech_tree.py` from the game's XML files.

## Data Extraction

The parser reads these files from your Old World installation (Steam macOS path: `~/Library/Application Support/Steam/steamapps/common/Old World/Reference/XML/Infos/`):

- `tech.xml`, `text-infos.xml`, `bonus.xml`, `nation.xml`, `text-nation.xml`, `unit.xml`, `improvement.xml`, `law.xml`, `project.xml`, `effectPlayer.xml`, `text-bonus.xml`, `color.xml`

Copy them into `XML/Infos/` (gitignored) and run:

```bash
python3 generate_tech_tree.py --xml-dir XML/Infos
```

The parser:

1. Parses techs, prereqs, costs, positions.
2. Scans unit/improvement/law/project XMLs to attribute unlocks to each tech.
3. Separates main techs from bonus cards (via `bHide`/`bTrash`/`bNoFree` flags).
4. Skips disabled techs (`bDisable="1"`).
5. Reads `CultureValid` for nation bonus cards (CULTURE_STRONG / CULTURE_LEGENDARY / CULTURE_DEVELOPING).
6. Pulls nation starting techs and nation-specific bonus card lists.
7. Reads each nation's team color from `color.xml` (`COLOR_NATION_<X>` / `_TEXT`), with a built-in fallback table for nations missing from the dump (the EOTI DLC nations), and emits a `crest` slug per nation matching `img/crests/<slug>.png`.
8. Fetches the live game version from `MohawkGames/main_buildnotes` (via `gh api`).
9. Computes a 4-char version hash and emits `window.versionMaps` so historical URLs migrate.
10. Writes everything to **`tech-data.js`** at the repo root.

## Generated `tech-data.js` shape

```js
window.gameVersion = "Old World vX.Y.Z (Mon DD, YYYY) | Generated …";

window.techData = {
  techs: [{ id, name, cost, column, row, prereqs, unlocks: {units, improvements, laws, projects} }, …],
  bonusTechs: [{ id, name, cost, parent, bonus, nation?, cultureRequired? }, …],
};

window.nationLookup = ["NATION_…", …];           // index order — URL encoder uses this
window.nationData = {
  startingTechs: { NATION_…: [techId, …] },
  nationNames: [{ id, name }, …],
  nationSpecificBonuses: { NATION_…: [bonusId, …] },
  colors: { NATION_…: { bg, accent, crest } },    // team color + crest slug (img/crests/<crest>.png)
};
window.currentVersionHash = "03e3";
window.versionMaps = { "67b2": { techs: [...], bonusTechs: [...] }, … };
```

## Repo layout

```
/
├── index.html              # Desktop redesign (static; loads tech-data.js)
├── phone.html              # Mobile surface (static; loads tech-data.js)
├── tree-app.js             # Desktop app logic (state, render, sim, undo/redo)
├── tree-styles.css         # Desktop styles (with editorial/atlas/codex direction variants)
├── phone-app.js            # Phone app logic
├── tech-data.js            # *** GENERATED *** by generate_tech_tree.py
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (cache-first shell, network-first data)
├── img/
│   ├── app-icon.svg, app-icon-{192,512}.png       # PWA icons
│   ├── crests/<nation>.png                         # Nation crest badges (from ../owreference)
│   └── icons/{techs,yields,specialists,resources} # Tech / yield / specialist / resource PNGs
├── generate_tech_tree.py   # XML → tech-data.js parser
├── test_parser.py          # unittest suite
├── README.md / URLPARAM.md
└── XML/Infos/              # *** GAME FILES *** (gitignored)
```

When committing `tech-data.js`, do it — it's a build artifact but it's also what GitHub Pages serves. Don't manually edit it.

## Feature Implementation Notes

### Desktop tree (`tree-app.js`)
- **Connections**: SVG layer behind the grid. Cubic Bézier from parent right-edge to child left-edge. Redraw on every state change and on resize via `requestAnimationFrame(drawConnections)`.
- **State**: `researchedTechs`, `researchOrder` (mixed mains+bonuses), `researchedBonusTechs`, `completedTechs`, `selectedNation`.
- **Tweaks panel**: postMessage handshake exposes `direction` (editorial/atlas/codex), `density`, `connections`, `card shape` toggles. These ship as design variants — they're not user-visible by default.
- **Simulation modal**: Real Monte-Carlo, ported from the legacy `template.html`. 1,000 runs × 4 Scholar/Oracle variants. Renders into `#simTable tbody`. Algorithm honors discard-pile reshuffling, Scholar-redraw heuristic, and the fact that bonus cards are *permanently lost* when discarded.

### Phone surface (`phone-app.js`)
- Same state shape as desktop; **shares `localStorage["owtt-redesign"]`** so a plan started on phone shows up on desktop and vice versa.
- URL params `?n=` and `?o=` are the same encoding as desktop (positive index = main tech, negative index = bonus card).
- Bonus cards appear inline under each tier (parent in that tier) plus a final "Unique bonuses" section for nation-specific culture-gated cards.
- Long-press / right-click toggles `completed`.

### Nation selection
- Tier-1 unique-unit bonus cards require CULTURE_STRONG (cost 250).
- Tier-2 require CULTURE_LEGENDARY (cost 700).
- Yuezhi's tier-1 requires CULTURE_DEVELOPING (cost 100).
- Starting techs auto-marked completed, can't be uncompleted.

### URL versioning
- `currentVersionHash` is hashed from the ordered list of all tech IDs.
- Old URLs encoded with a different version remap via `versionMaps` lookups.
- Add a snapshot to `VERSION_HISTORY` in `generate_tech_tree.py` *before* regenerating after a patch.

### PWA
- `manifest.webmanifest` enables Add-to-Home-Screen with maskable icons.
- `sw.js` precaches the shell (HTML/CSS/JS/icons) on install and serves them cache-first. `tech-data.js` is network-first so a regen reaches users without a manual cache bump. Bump `CACHE_VERSION` if you ever need to force a refresh.

## Testing

```bash
python3 -m unittest test_parser -v
```

Test classes:
- `TestParserWithLatestGameData` — parser output correctness (disabled-tech filtering, culture levels, costs, EOTI nations).
- `TestTechDataJsGeneration` — emitted `tech-data.js` exposes the right `window.*` globals and contents.
- `TestVersionHash` — hash determinism, length, sensitivity.
- `TestStaticAssetsPresent` — guards against accidentally deleting deploy assets.

## Updating for a new game version

1. Snapshot the current hash → `VERSION_HISTORY` in `generate_tech_tree.py` if the tech list changes.
2. Copy new XML into `XML/Infos/`.
3. `python3 generate_tech_tree.py --xml-dir XML/Infos`
4. `python3 -m unittest test_parser -v`
5. Commit `tech-data.js` + the `VERSION_HISTORY` change, push.

## Deployment

GitHub Pages serves from `main`. Push → live.

## Copyright

This repo contains only the web app + parser. Users supply their own copy of Old World's XML files.
