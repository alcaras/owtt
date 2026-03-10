# Claude Development Notes

This document contains instructions for Claude instances or developers working on this Old World Tech Tree project.

## Project Overview

This is an interactive web-based tech tree for the strategy game Old World by Mohawk Games. All technology data has been extracted from the official game files and embedded into a single HTML file.

## Data Extraction Process

The tech tree data is automatically extracted from Old World game files using the `generate_tech_tree.py` parser.

### Required Game Files
The parser reads these files from your Old World installation:
- `XML/Infos/tech.xml` - Technology definitions, prerequisites, costs, positions
- `XML/Infos/text-infos.xml` - Technology names and descriptions
- `XML/Infos/bonus.xml` - Bonus technology values
- `XML/Infos/nation.xml` - Nation starting technologies
- `XML/Infos/text-nation.xml` - Nation display names
- `XML/Infos/unit.xml` - Unit tech requirements (for unlocks)
- `XML/Infos/improvement.xml` - Improvement tech requirements
- `XML/Infos/law.xml` - Law tech requirements
- `XML/Infos/project.xml` - Project tech requirements
- `XML/Infos/effectPlayer.xml` - Additional unlock effects

Steam game files are located at:
- macOS: `~/Library/Application Support/Steam/steamapps/common/Old World/Reference/XML/Infos/`

### Parser Functionality

The `generate_tech_tree.py` parser automatically:

1. **Extracts Technologies**: Reads all techs from `tech.xml` including costs, positions, and prerequisites
2. **Parses Unlocks**: Scans unit.xml, improvement.xml, law.xml, and project.xml to find what each tech unlocks
3. **Identifies Bonus Cards**: Separates bonus techs from main techs based on flags (`bHide`, `bTrash`, `bNoFree`)
4. **Filters Disabled Techs**: Skips techs with `bDisable="1"` (e.g., removed Crossbowman Windlass, Silk, Ebony bonuses)
5. **Parses Culture Requirements**: Reads `CultureValid` field for nation bonus techs (CULTURE_STRONG/CULTURE_LEGENDARY)
6. **Handles Special Cases**:
   - Victory techs (Economic Reform, Military Prestige, Industrial Progress) are main techs
   - Resource bonuses (luxuries) are included as bonus cards
   - Event bonuses are excluded from display
7. **Extracts Nation Data**: Reads starting techs and nation-specific bonuses
8. **Fetches Game Version**: Queries `MohawkGames/main_buildnotes` GitHub repo for latest version string
9. **Computes Version Hash**: Generates a 4-char hex hash of tech ID ordering for URL stability
10. **Formats Output**: Generates complete index.html with all data and UI functionality

## Key Data Structures in index.html

The extracted data is embedded as JavaScript objects:

```javascript
const techData = {
    techs: [ /* 49 main technologies (46 regular + 3 victory) */ ],
    bonusTechs: [ /* 53 bonus technologies including 20 nation-specific */ ]
};

const nationData = {
    startingTechs: { /* 3 starting techs per nation */ },
    nationSpecificBonuses: { /* Unique unit bonuses per nation */ }
};

const currentVersionHash = "67b2";  // Short hash of tech ID ordering
const versionMaps = {};  // Old version hash -> tech ID lists for URL migration
```

## Architecture

- **Template System**: Uses `template.html` with placeholders (`{{TECH_DATA}}`, `{{NATION_DATA}}`, `{{VERSION_HASH}}`, `{{VERSION_HISTORY}}`, `{{GAME_VERSION}}`)
- **Single Output File**: Everything is generated into `index.html` for easy deployment
- **localStorage Persistence**: Tech tree state persists across page reloads
- **No Dependencies**: Uses only vanilla JavaScript and CSS
- **Leader Line Library**: External CDN library for drawing prerequisite connections
- **Responsive Design**: CSS Grid with media queries for mobile support

## Feature Implementation Notes

### Nation Selection
- Nation-specific bonus cards require culture levels instead of tech prerequisites:
  - Tier 1 (cost 200): Requires CULTURE_STRONG
  - Tier 2 (cost 600): Requires CULTURE_LEGENDARY
- Starting techs are automatically added when selecting a nation
- Starting techs show as "FREE" with crossed-out costs
- Starting techs are always marked as completed (green) and cannot be uncompleted
- Nation-specific bonus cards are filtered based on selection
- Smart nation switching logic:
  - Old starting techs that are dependencies for other researched techs are kept as regular techs
  - Old starting techs that aren't dependencies are removed
  - Techs that are starting techs for both nations remain as starting techs
  - Nation-specific bonus cards from the previous nation are removed
  - Bonus techs whose parent tech was removed are also removed
  - researchOrder is filtered (not sliced) to preserve bonus tech entries
  - Starting techs are pushed as tech IDs (not timestamps) into researchOrder

### Research Completion Tracking
- Click techs in research order to mark as completed
- Completed techs show green background in tech tree and green checkmark in order list
- On-path techs (planned but not completed) show blue background in tech tree
- Available techs show gold/yellow background
- Starting techs are automatically marked as completed and cannot be toggled
- Completion state is persisted in localStorage as `completedTechs` array

### Prerequisite System
- Clicking any tech automatically adds all required prerequisites
- Uses recursive `getAllPrerequisites()` function
- Prevents circular dependencies

### Cost Tracking
- Purple background shows total science cost
- Golden background shows total laws unlocked
- FREE starting techs don't count toward cost

### Share System
- URLs use unified encoding format documented in `URLPARAM.md`
- Compact representation using tech array indices
- Version hash parameter: `v=67b2` (4-char hex hash for cross-version compatibility)
- Nation parameter: `n=0-9` (nation index)
- Research order parameter: `o=1,2,-1,3` (positive=main techs, negative=bonus cards)
- Preserves exact click order for accurate build sharing
- Full state restoration from URL parameters
- Backwards compatibility with old URL formats (no `v` param treated as current version)

### URL Version Migration
- URLs include a short version hash (`v=XXXX`) computed from the ordered tech ID lists
- When the tech list changes between game updates, old URLs are migrated:
  - `VERSION_HISTORY` in `generate_tech_tree.py` maps old hashes to their tech ID orderings
  - Old indices are translated: old index -> tech ID (via old mapping) -> current index
  - Removed techs are skipped with a dismissable warning banner
  - Unrecognized version hashes show a "may not load correctly" warning
- URLs without a `v` param (pre-versioning links) are treated as current version

### State Persistence
- localStorage automatically saves tech selections, nation choice, research order, and completion status
- State includes: `researchedTechs`, `researchOrder`, `researchedBonusTechs`, `completedTechs`, `selectedNation`
- State is restored on page reload unless URL parameters are present
- URL parameters take priority over localStorage for sharing links
- When loading from URL params, state is immediately saved to localStorage so it persists on reload
- Starting techs are properly maintained during nation selection and page reloads

### Game Version Display
- Sidebar footer shows the game version and generation date
- Version is auto-fetched from `MohawkGames/main_buildnotes` GitHub repo via `gh api`
- Format: "Old World v1.0.82189 (Feb 18, 2026) | Generated Mar 09, 2026"
- Build notes repos:
  - Main branch: `MohawkGames/main_buildnotes` (files named `Old World Release update YYYY.MM.DD`)
  - Test branch: `MohawkGames/test_buildnotes` (files named `Old World Test update YYYY.MM.DD`)
  - First line format: `Main Branch X.X.XXXXX Release YYYY-MM-DD`

## Data Accuracy

All data was extracted directly from game files to ensure accuracy:
- Tech costs, prerequisites, and positions match the game
- Unlock information verified against multiple XML files
- Nation starting techs and bonuses confirmed from nation.xml
- Bonus amounts extracted from bonus.xml for exact values

## Updating for New Game Versions

When Old World receives updates:

1. **Copy Game Files**: Copy XML files from Steam installation to `XML/Infos/`
   ```bash
   cp ~/Library/Application\ Support/Steam/steamapps/common/Old\ World/Reference/XML/Infos/{tech,text-infos,bonus,nation,text-nation,unit,improvement,law,project,effectPlayer,text-bonus}.xml XML/Infos/
   ```
2. **Snapshot Version History**: If the tech list changed, add the current version's hash and ID lists to `VERSION_HISTORY` in `generate_tech_tree.py` before regenerating (preserves old URL compatibility)
3. **Run Parser**: Execute `python3 generate_tech_tree.py --xml-dir XML/Infos`
4. **Run Tests**: Execute `python3 -m unittest test_parser -v` to verify correctness
5. **Deploy**: Commit and push changes to update the live site

## Testing

The project uses `test_parser.py` with Python's `unittest` framework:

```bash
# Run all tests
python3 -m unittest test_parser -v
```

Test categories:
- **TestParserWithLatestGameData**: Verifies parser output (disabled techs filtered, culture requirements, costs, etc.)
- **TestHTMLGeneration**: Verifies generated HTML contains correct data
- **TestVersionHash**: Verifies version hashing, determinism, and template integration
- **TestTemplateBugs**: Verifies template source code patterns (no timestamps in researchOrder, proper filtering, localStorage persistence)

## Common Patterns for Data Extraction

### Finding Technologies:
```bash
grep -A 15 "<Type>TECH_" XML/Infos/tech.xml
```

### Finding Prerequisites:
```bash
grep -A 5 "aePrereqTechs" XML/Infos/tech.xml
```

### Finding Nation Starting Techs:
```bash
grep -A 5 "aeStartingTech" XML/Infos/nation.xml
```

### Finding Bonus Technologies:
```bash
grep -B 5 -A 10 'bHide="1".*bTrash="1"' XML/Infos/tech.xml
```

## Development Environment

The project was developed using:
- Claude Code for implementation
- Git for version control
- GitHub Pages for deployment
- No build process - direct HTML/CSS/JS

## File Structure

```
/
├── template.html          # Template with placeholders for generated data
├── index.html             # Generated application (output of parser)
├── styles.css             # CSS styles (referenced by template)
├── generate_tech_tree.py  # Parser that converts XML files to HTML
├── test_parser.py         # Test suite for parser and template bugs
├── README.md              # User documentation
├── CLAUDE.md              # This development guide
├── URLPARAM.md            # URL parameter format documentation
├── XML/Infos/             # Old World game files (not included in repo)
└── .gitignore             # Excludes game files and temp files
```

## Deployment

The project is deployed on GitHub Pages at https://alcaras.github.io/owtt/

To deploy updates:
1. Commit changes to main branch
2. Push to GitHub
3. GitHub Pages automatically updates the live site

## Copyright Notice

This project contains only the web application code. It does NOT include any copyrighted Old World game files. Users must have their own legal copy of Old World to extract game data for personal use.

## Technical Decisions

- **Template System**: Uses simple placeholder replacement instead of complex regex patterns for maintainability
- **localStorage Persistence**: Provides seamless user experience across sessions while respecting URL sharing
- **Single Output File**: Keeps deployment simple and ensures all dependencies are contained
- **Embedded Data**: Chose to embed extracted data rather than include game files to avoid copyright issues
- **Vanilla JS**: Avoids build complexity and framework dependencies
- **CSS Grid**: Provides precise positioning for the tech tree layout
- **Leader Line**: External library was necessary for drawing clean prerequisite connections
- **URL Index Encoding**: Uses array indices (not tech IDs) for compact URLs, with version hashing for cross-version compatibility
- **Version History Snapshots**: ~2KB per version, negligible size cost for indefinite backwards URL compatibility

## Parser Implementation Details

The parser uses a clean template system:

1. **Template Structure**: `template.html` contains complete HTML with placeholder markers
2. **Data Injection**: Parser replaces placeholders (`{{TECH_DATA}}`, `{{NATION_DATA}}`, `{{VERSION_HASH}}`, `{{VERSION_HISTORY}}`, `{{GAME_VERSION}}`) with generated JavaScript
3. **Manual Mappings**: Laws and improvements require manual mapping since XML doesn't contain direct tech prerequisites
4. **Icon Logic**: Different emojis for units, improvements, laws, projects, and bonus cards
5. **Version Detection**: Fetches latest game version from Mohawk's GitHub build notes repo via `gh api`

### Usage Examples:

```bash
# Basic usage with XML files in XML/Infos/
python3 generate_tech_tree.py --xml-dir XML/Infos

# Custom template and output
python3 generate_tech_tree.py --xml-dir /path/to/oldworld/XML/Infos --template my_template.html --output my_output.html

# Export raw data for debugging
python3 generate_tech_tree.py --xml-dir XML/Infos --export-json debug.json
```

This approach ensures the project can be easily maintained and deployed while respecting the game's intellectual property.
- edit template.html since index.html is generated by the python script
