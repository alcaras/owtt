# URL Parameter Documentation

This document describes the URL parameter format used by the Old World Tech Tree tool for sharing builds.

## Parameter Format

The URL parameters use a compact encoding format to keep URLs short and shareable:

```
https://example.com/owtt/?n=5&o=1,2,-1,3,-2
```

## Parameters

### `n` - Nation (required for builds with nations)
- **Format**: Single integer (0-9)
- **Description**: Index of the selected nation
- **Mapping**:
  - `0` = Aksum
  - `1` = Assyria  
  - `2` = Babylonia
  - `3` = Carthage
  - `4` = Egypt
  - `5` = Greece
  - `6` = Hittite
  - `7` = Kush
  - `8` = Persia
  - `9` = Rome

### `o` - Research Order (required for builds with techs)
- **Format**: Comma-separated list of integers
- **Description**: Research order using unified encoding for main techs and bonus cards
- **Encoding Rules**:
  - **Positive numbers** (0, 1, 2, ...): Main technologies by array index
  - **Negative numbers** (-1, -2, -3, ...): Bonus cards by array index
    - `-1` = bonus card at index 0
    - `-2` = bonus card at index 1
    - `-3` = bonus card at index 2
    - etc.

## Examples

### Simple Build with Nation Only
```
?n=5
```
- Greece selected, no technologies researched

### Build with Main Technologies
```
?n=8&o=0,2,6,5
```
- Persia selected
- Research order: Main tech 0, Main tech 2, Main tech 6, Main tech 5

### Build with Bonus Cards
```
?n=8&o=0,2,-1,6,5,-2
```
- Persia selected  
- Research order: Main tech 0, Main tech 2, Bonus card 0, Main tech 6, Main tech 5, Bonus card 1

### Complex Build
```
?n=7&o=1,2,6,5,13,20,26,-7,-13,-12
```
- Kush selected
- Mixed research order with main techs and bonus cards in clicked order

## Technical Details

### Array Index Mapping
- Main tech indices correspond to positions in the `techData.techs` array
- Bonus card indices correspond to positions in the `techData.bonusTechs` array
- Arrays are 0-indexed, so first item is index 0

### Prerequisites
- When loading from URL, all prerequisites are automatically added
- Prerequisites maintain proper tech tree dependencies
- URL only stores explicitly selected techs, not auto-added prerequisites

### Backwards Compatibility
The tool maintains backwards compatibility with older URL formats:
- `nation=NAME` - Old nation format using full nation name
- `t=1,2,3` - Old main techs format (separate from bonus cards)  
- `b=1,2,3` - Old bonus cards format (separate from main techs)

These are automatically converted to the new unified format when loaded.

## Implementation Notes

### URL Generation
- URLs are automatically updated when techs are selected/deselected
- URL reflects exact click order for accurate sharing
- Empty research order results in nation-only URL

### URL Loading
- URL parameters take priority over localStorage
- After loading from URL, current state is maintained in browser address bar
- Prerequisites are automatically resolved and added to research order

### Limitations
- Maximum URL length depends on browser (typically 2000+ characters)
- Very large tech trees may exceed URL limits
- No validation of tech indices - invalid indices are silently ignored